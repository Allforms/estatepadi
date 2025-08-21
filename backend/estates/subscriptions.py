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
        'plan': {
            'name': subscription.plan.name,
            'amount': subscription.plan.amount,
            'interval': subscription.plan.interval
        }
    }, status=status.HTTP_200_OK)