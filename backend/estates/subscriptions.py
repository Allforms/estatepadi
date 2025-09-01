import datetime
from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from paystackapi.paystack import Paystack

from .models import SubscriptionPlan, EstateSubscription
from .serializers import SubscriptionPlanSerializer

paystack = Paystack(secret_key=settings.PAYSTACK_SECRET_KEY)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_subscription(request):
    if request.user.role != 'admin':
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    plan_id = request.data.get('plan_id')
    reference = request.data.get('reference')

    if not plan_id:
        return Response({'error': 'plan_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
    if not reference:
        return Response({'error': 'reference is required.'}, status=status.HTTP_400_BAD_REQUEST)

    plan = get_object_or_404(SubscriptionPlan, pk=plan_id)
    estate = request.user.estate

    # Verify the payment with Paystack
    try:
        verify_resp = paystack.transaction.verify(reference)
    except Exception as e:
        return Response({'error': f'Paystack verification failed: {e}'}, status=status.HTTP_502_BAD_GATEWAY)

    if not verify_resp.get('status') or 'data' not in verify_resp:
        return Response({'error': 'Failed to verify transaction.', 'details': verify_resp}, status=status.HTTP_400_BAD_REQUEST)

    transaction_data = verify_resp['data']
    if transaction_data.get('status') != 'success':
        return Response({'error': 'Transaction not successful.', 'details': transaction_data}, status=status.HTTP_400_BAD_REQUEST)

    authorization = transaction_data.get('authorization', {}).get('authorization_code')
    if not authorization:
        return Response({'error': 'Authorization code missing from Paystack verification.'}, status=status.HTTP_400_BAD_REQUEST)

    # Check if customer already exists
    customer_code = None
    if hasattr(estate, 'subscription') and estate.subscription.paystack_customer_code:
        customer_code = estate.subscription.paystack_customer_code
    else:
        try:
            cust_resp = paystack.customer.create(
                email=request.user.email,
                first_name=getattr(request.user, 'first_name', '') or '',
                last_name=getattr(request.user, 'last_name', '') or '',
                phone=getattr(request.user, 'phone_number', '')
            )
        except Exception as e:
            return Response({'error': f'Paystack customer creation failed: {e}'}, status=status.HTTP_502_BAD_GATEWAY)

        if not cust_resp.get('status') or 'data' not in cust_resp:
            return Response({'error': 'Failed to create Paystack customer.', 'details': cust_resp}, status=status.HTTP_400_BAD_REQUEST)

        customer_code = cust_resp['data'].get('customer_code')
        if not customer_code:
            return Response({'error': 'Missing customer_code in Paystack response.', 'details': cust_resp}, status=status.HTTP_502_BAD_GATEWAY)

    # Create Subscription
    try:
        sub_resp = paystack.subscription.create(
            customer=customer_code,
            plan=plan.paystack_plan_code,
            authorization=authorization
        )
    except Exception as e:
        return Response({'error': f'Paystack subscription creation failed: {e}'}, status=status.HTTP_502_BAD_GATEWAY)

    if not sub_resp.get('status') or 'data' not in sub_resp:
        return Response({'error': 'Failed to create subscription.', 'details': sub_resp}, status=status.HTTP_400_BAD_REQUEST)

    subscription_data = sub_resp['data']
    next_date = datetime.datetime.fromtimestamp(
        subscription_data['next_payment_date'],
        tz=datetime.timezone.utc
    )

    estate_sub, _ = EstateSubscription.objects.update_or_create(
        estate=estate,
        defaults={
            'paystack_customer_code': customer_code,
            'paystack_subscription_code': subscription_data['subscription_code'],
            'authorization_code': authorization,  # Store authorization code
            'plan': plan,
            'status': subscription_data.get('status', 'active'),
            'next_billing_date': next_date
        }
    )

    return Response({
        'subscription_code': subscription_data['subscription_code'],
        'status': estate_sub.status,
        'next_billing_date': estate_sub.next_billing_date,
        'plan': {
            'id': plan.id,
            'name': plan.name,
            'amount': plan.amount,
            'interval': plan.interval
        }
    }, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def cancel_subscription(request):
    """
    Cancel the user's active subscription
    """
    if request.user.role != 'admin':
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    estate = request.user.estate
    
    # Check if estate has an active subscription
    try:
        subscription = EstateSubscription.objects.get(
            estate=estate,
            status='active'
        )
    except EstateSubscription.DoesNotExist:
        return Response({
            'error': 'No active subscription found for this estate.'
        }, status=status.HTTP_404_NOT_FOUND)

    # Handle subscriptions with missing Paystack codes
    if not subscription.paystack_subscription_code:
        # Try to fetch the subscription code from Paystack using customer code
        if subscription.paystack_customer_code:
            try:
                # Get customer's subscriptions from Paystack
                customer_subs = paystack.subscription.list(
                    customer=subscription.paystack_customer_code
                )
                
                if customer_subs.get('status') and customer_subs.get('data'):
                    # Find active subscription for this plan
                    active_subs = [
                        sub for sub in customer_subs['data'] 
                        if sub.get('status') == 'active' and 
                        sub.get('plan', {}).get('plan_code') == subscription.plan.paystack_plan_code
                    ]
                    
                    if active_subs:
                        # Update our record with the found subscription code
                        paystack_sub_code = active_subs[0]['subscription_code']
                        subscription.paystack_subscription_code = paystack_sub_code
                        subscription.save()
                        print(f"Found and updated subscription code: {paystack_sub_code}")
                    else:
                        # No active subscription found on Paystack, just cancel locally
                        subscription.status = 'cancelled'
                        subscription.updated_at = datetime.datetime.now(datetime.timezone.utc)
                        subscription.save()
                        
                        return Response({
                            'message': 'Subscription cancelled successfully (local only - no active subscription found on Paystack).',
                            'cancelled_at': subscription.updated_at,
                            'plan_name': subscription.plan.name
                        }, status=status.HTTP_200_OK)
                        
            except Exception as e:
                print(f"Error fetching customer subscriptions: {e}")
                # Fall back to local cancellation
                subscription.status = 'cancelled'
                subscription.updated_at = datetime.datetime.now(datetime.timezone.utc)
                subscription.save()
                
                return Response({
                    'message': 'Subscription cancelled locally (could not verify with Paystack).',
                    'cancelled_at': subscription.updated_at,
                    'plan_name': subscription.plan.name,
                    'warning': 'Could not cancel on Paystack - please verify manually'
                }, status=status.HTTP_200_OK)
        else:
            # No customer code either, just cancel locally
            subscription.status = 'cancelled'
            subscription.updated_at = datetime.datetime.now(datetime.timezone.utc)
            subscription.save()
            
            return Response({
                'message': 'Subscription cancelled locally (no Paystack reference found).',
                'cancelled_at': subscription.updated_at,
                'plan_name': subscription.plan.name
            }, status=status.HTTP_200_OK)

    # Now we should have a subscription code, proceed with Paystack cancellation
    try:
        # Use the disable endpoint to cancel the subscription
        cancel_resp = paystack.subscription.disable(
            code=subscription.paystack_subscription_code,
            token=subscription.email_token
        )
        
        print(f"Paystack cancel response: {cancel_resp}")
        
    except Exception as e:
        print(f"Paystack API error: {e}")
        return Response({
            'error': f'Failed to cancel subscription with Paystack: {str(e)}'
        }, status=status.HTTP_502_BAD_GATEWAY)

    # Check if the cancellation was successful
    if not cancel_resp.get('status'):
        print(f"Paystack cancel failed: {cancel_resp}")
        return Response({
            'error': 'Failed to cancel subscription with Paystack.',
            'details': cancel_resp.get('message', 'Unknown error')
        }, status=status.HTTP_400_BAD_REQUEST)

    # Update local subscription status
    subscription.status = 'cancelled'
    subscription.updated_at = datetime.datetime.now(datetime.timezone.utc)
    subscription.save()

    return Response({
        'message': 'Subscription cancelled successfully.',
        'subscription_code': subscription.paystack_subscription_code,
        'cancelled_at': subscription.updated_at,
        'plan_name': subscription.plan.name
    }, status=status.HTTP_200_OK)



# This code handles the creation of a subscription for an estate using the Paystack API.
# It checks if the user is an admin, creates a Paystack customer, creates a subscription,
# and saves the subscription details in the database. It returns the subscription code, status,
# and next billing date in the response.




@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def subscription_plans(request):
    plans = SubscriptionPlan.objects.all()
    serializer = SubscriptionPlanSerializer(plans, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def subscription_status(request):
    user = request.user
    estate = getattr(user, 'estate', None)

    if not estate or not hasattr(estate, 'subscription'):
        return Response({'status': 'inactive', 'message': 'No subscription found.'},
                        status=status.HTTP_200_OK)

    subscription = estate.subscription
    return Response({
        'status': subscription.status,
        'next_billing_date': subscription.next_billing_date,
        'can_cancel': subscription.status == 'active',  # Add this to help frontend
        'plan': {
            'name': subscription.plan.name,
            'amount': subscription.plan.amount,
            'interval': subscription.plan.interval
        }
    }, status=status.HTTP_200_OK)
