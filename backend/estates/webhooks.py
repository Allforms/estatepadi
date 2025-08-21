import hmac
import hashlib
import datetime
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework import permissions
from .models import EstateSubscription, SubscriptionPlan, Estate

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@csrf_exempt
def paystack_webhook(request):
    paystack_secret = settings.PAYSTACK_SECRET_KEY
    signature = request.headers.get('x-paystack-signature')
    
    computed_hash = hmac.new(
        paystack_secret.encode(),
        msg=request.body,
        digestmod=hashlib.sha512
    ).hexdigest()
    
    if signature != computed_hash:
        return Response({'error': 'Invalid signature'}, status=400)
    
    event = request.data.get('event')
    print(f"Webhook received event: {event}")
    
    # Handle subscription creation (first payment) - comes as charge.success when using plan parameter
    if event == 'charge.success':
        data = request.data.get('data', {})
        
        # Check if this is a subscription payment by looking for plan data
        plan_data = data.get('plan', {})
        if not plan_data:
            print("charge.success received but no plan data. This is a one-time payment, not a subscription. Ignoring.")
            return Response({'status': 'ignored'}, status=200)
        
        customer_data = data.get('customer', {})
        authorization_data = data.get('authorization', {})
        
        # For subscription payments, these fields should be present
        subscription_code = data.get('subscription_code')  # This might be None for first payment
        plan_code = plan_data.get('plan_code')
        customer_email = customer_data.get('email')
        customer_code = customer_data.get('customer_code')
        authorization_code = authorization_data.get('authorization_code')
        
        print(f"Subscription payment data: plan_code={plan_code}, customer_email={customer_email}, subscription_code={subscription_code}, authorization_code={authorization_code}")
        
        if not all([plan_code, customer_email, customer_code]):
            print("Missing essential customer or plan information.")
            return Response({'status': 'ignored'}, status=200)
        
        estate = Estate.objects.filter(user__email=customer_email).first()
        if not estate:
            print(f"No estate found for email: {customer_email}")
            return Response({'status': 'ignored'}, status=200)
        
        plan = SubscriptionPlan.objects.filter(paystack_plan_code=plan_code).first()
        if not plan:
            print(f"No plan found for code: {plan_code}")
            return Response({'status': 'ignored'}, status=200)
        
        # Calculate next billing date based on plan interval
        now = datetime.datetime.now(datetime.timezone.utc)
        if plan.interval == 'monthly':
            next_date = now.replace(day=1) + datetime.timedelta(days=32)
            next_date = next_date.replace(day=1)
        elif plan.interval == 'yearly':
            next_date = now.replace(year=now.year + 1)
        else:
            # Default to monthly
            next_date = now.replace(day=1) + datetime.timedelta(days=32)
            next_date = next_date.replace(day=1)
        
        estate_sub, created = EstateSubscription.objects.update_or_create(
            estate=estate,
            defaults={
                'paystack_customer_code': customer_code,
                'paystack_subscription_code': subscription_code or '',  
                'authorization_code': authorization_code or '',  
                'plan': plan,
                'status': 'active',
                'next_billing_date': next_date
            }
        )
        
        action = "created" if created else "updated"
        print(f"Subscription {action} for estate {estate.name}")
    
    # Handle subscription creation event (if it comes separately)
    elif event == 'subscription.create':
        data = request.data.get('data', {})
        
        subscription_code = data.get('subscription_code')
        customer_data = data.get('customer', {})
        plan_data = data.get('plan', {})
        next_payment_date = data.get('next_payment_date')
        
        if not all([subscription_code, customer_data, plan_data]):
            print("subscription.create received but incomplete data. Ignoring.")
            return Response({'status': 'ignored'}, status=200)
        
        plan_code = plan_data.get('plan_code')
        customer_email = customer_data.get('email')
        customer_code = customer_data.get('customer_code')
        
        if not all([plan_code, customer_email, customer_code]):
            print("Missing essential customer or plan information.")
            return Response({'status': 'ignored'}, status=200)
        
        estate = Estate.objects.filter(user__email=customer_email).first()
        if not estate:
            print(f"No estate found for email: {customer_email}")
            return Response({'status': 'ignored'}, status=200)
        
        plan = SubscriptionPlan.objects.filter(paystack_plan_code=plan_code).first()
        if not plan:
            print(f"No plan found for code: {plan_code}")
            return Response({'status': 'ignored'}, status=200)
        
        # Convert next_payment_date to datetime
        if next_payment_date:
            if isinstance(next_payment_date, str):
                next_date = datetime.datetime.fromisoformat(next_payment_date.replace('Z', '+00:00'))
            else:
                next_date = datetime.datetime.fromtimestamp(next_payment_date, tz=datetime.timezone.utc)
        else:
            # Fallback calculation
            now = datetime.datetime.now(datetime.timezone.utc)
            if plan.interval == 'monthly':
                next_date = now.replace(day=1) + datetime.timedelta(days=32)
                next_date = next_date.replace(day=1)
            elif plan.interval == 'yearly':
                next_date = now.replace(year=now.year + 1)
            else:
                next_date = now.replace(day=1) + datetime.timedelta(days=32)
                next_date = next_date.replace(day=1)
        
        # Update existing subscription with the subscription_code
        try:
            estate_sub = EstateSubscription.objects.get(
                estate=estate,
                paystack_customer_code=customer_code
            )
            estate_sub.paystack_subscription_code = subscription_code
            estate_sub.next_billing_date = next_date
            # Also update authorization_code if it exists in the subscription.create event
            authorization_data = data.get('authorization', {})
            if authorization_data and authorization_data.get('authorization_code'):
                estate_sub.authorization_code = authorization_data.get('authorization_code')
            estate_sub.save()
            print(f"Updated subscription code for estate {estate.name}")
        except EstateSubscription.DoesNotExist:
            # Create new subscription
            authorization_data = data.get('authorization', {})
            authorization_code = authorization_data.get('authorization_code', '') if authorization_data else ''
            
            estate_sub = EstateSubscription.objects.create(
                estate=estate,
                paystack_customer_code=customer_code,
                paystack_subscription_code=subscription_code,
                authorization_code=authorization_code,
                plan=plan,
                status='active',
                next_billing_date=next_date
            )
            print(f"Created new subscription for estate {estate.name}")
    
    # Handle successful subscription renewals
    elif event == 'invoice.payment_successful':
        data = request.data.get('data', {})
        
        subscription_data = data.get('subscription', {})
        subscription_code = subscription_data.get('subscription_code')
        
        if not subscription_code:
            print("invoice.payment_successful received but no subscription_code. Ignoring.")
            return Response({'status': 'ignored'}, status=200)
        
        try:
            estate_sub = EstateSubscription.objects.get(
                paystack_subscription_code=subscription_code
            )
            
            # Update next billing date
            next_payment_date = subscription_data.get('next_payment_date')
            if next_payment_date:
                if isinstance(next_payment_date, str):
                    next_date = datetime.datetime.fromisoformat(next_payment_date.replace('Z', '+00:00'))
                else:
                    next_date = datetime.datetime.fromtimestamp(next_payment_date, tz=datetime.timezone.utc)
                
                estate_sub.next_billing_date = next_date
                estate_sub.status = 'active'
                estate_sub.save()
                
                print(f"Subscription renewed for estate {estate_sub.estate.name}")
            
        except EstateSubscription.DoesNotExist:
            print(f"No subscription found for code: {subscription_code}")
            return Response({'status': 'ignored'}, status=200)
    
    # Handle subscription cancellation/expiration
    elif event == 'subscription.disable':
        data = request.data.get('data', {})
        subscription_code = data.get('subscription_code')
        
        if not subscription_code:
            print("subscription.disable received but no subscription_code. Ignoring.")
            return Response({'status': 'ignored'}, status=200)
        
        try:
            estate_sub = EstateSubscription.objects.get(
                paystack_subscription_code=subscription_code
            )
            estate_sub.status = 'cancelled'
            estate_sub.save()
            
            print(f"Subscription disabled for estate {estate_sub.estate.name}")
            
        except EstateSubscription.DoesNotExist:
            print(f"No subscription found for code: {subscription_code}")
            return Response({'status': 'ignored'}, status=200)
    
    # Handle failed payments
    elif event == 'invoice.payment_failed':
        data = request.data.get('data', {})
        
        subscription_data = data.get('subscription', {})
        subscription_code = subscription_data.get('subscription_code')
        
        if not subscription_code:
            print("invoice.payment_failed received but no subscription_code. Ignoring.")
            return Response({'status': 'ignored'}, status=200)
        
        try:
            estate_sub = EstateSubscription.objects.get(
                paystack_subscription_code=subscription_code
            )
            estate_sub.status = 'past_due'
            estate_sub.save()
            
            print(f"Payment failed for subscription {estate_sub.estate.name}")
            
        except EstateSubscription.DoesNotExist:
            print(f"No subscription found for code: {subscription_code}")
            return Response({'status': 'ignored'}, status=200)
    
    else:
        print(f"Unhandled event type: {event}")
    
    return Response({'status': 'success'}, status=200)