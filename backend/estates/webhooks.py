import hmac
import hashlib
import datetime
from dateutil.relativedelta import relativedelta
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework import permissions
from .models import EstateSubscription, SubscriptionPlan, Estate


def calculate_next_billing_date(plan, current_date=None):
    """Calculate next billing date based on plan interval"""
    if current_date is None:
        current_date = datetime.datetime.now(datetime.timezone.utc)
    
    if plan.interval == 'monthly':
        return current_date + relativedelta(months=1)
    elif plan.interval == 'yearly':
        return current_date + relativedelta(years=1)
    else:
        # Default to monthly if interval is unknown
        return current_date + relativedelta(months=1)


def parse_paystack_date(date_string):
    """Parse Paystack date string to timezone-aware datetime"""
    if not date_string:
        return None
    
    # Handle different date formats from Paystack
    try:
        if date_string.endswith('Z'):
            date_string = date_string.replace('Z', '+00:00')
        return datetime.datetime.fromisoformat(date_string)
    except ValueError:
        # If parsing fails, return None so we can calculate manually
        return None


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
    data = request.data.get('data', {})
    print(f"Webhook received event: {event}")

    # ---------- CHARGE SUCCESS (first payment) ----------
    if event == 'charge.success':
        plan_data = data.get('plan', {})
        if not plan_data:
            return Response({'status': 'ignored'}, status=200)

        customer_data = data.get('customer', {})
        authorization_data = data.get('authorization', {})

        subscription_code = data.get('subscription_code')
        plan_code = plan_data.get('plan_code')
        customer_email = customer_data.get('email')
        customer_code = customer_data.get('customer_code')
        authorization_code = authorization_data.get('authorization_code')

        estate = Estate.objects.filter(user__email=customer_email).first()
        plan = SubscriptionPlan.objects.filter(paystack_plan_code=plan_code).first()
        if not estate or not plan:
            return Response({'status': 'ignored'}, status=200)

        # Use the transaction date if available, otherwise use current time
        paid_at = data.get('paid_at') or data.get('created_at')
        if paid_at:
            payment_date = parse_paystack_date(paid_at)
            if payment_date is None:
                payment_date = datetime.datetime.now(datetime.timezone.utc)
        else:
            payment_date = datetime.datetime.now(datetime.timezone.utc)

        next_date = calculate_next_billing_date(plan, payment_date)

        existing_sub = EstateSubscription.objects.filter(
            estate=estate,
            paystack_customer_code=customer_code
        ).first()

        if existing_sub:
            existing_sub.authorization_code = authorization_code or existing_sub.authorization_code
            existing_sub.plan = plan
            existing_sub.status = 'active'
            existing_sub.next_billing_date = next_date
            if subscription_code and not existing_sub.paystack_subscription_code:
                existing_sub.paystack_subscription_code = subscription_code
            existing_sub.save()
            print(f"Updated subscription - Next billing: {next_date}")
        else:
            sub = EstateSubscription.objects.create(
                estate=estate,
                paystack_customer_code=customer_code,
                paystack_subscription_code=subscription_code or '',
                authorization_code=authorization_code or '',
                plan=plan,
                status='active',
                next_billing_date=next_date
            )
            print(f"Created subscription - Next billing: {next_date}")

    # ---------- SUBSCRIPTION CREATE ----------
    elif event == 'subscription.create':
        subscription_code = data.get('subscription_code')
        customer_data = data.get('customer', {})
        plan_data = data.get('plan', {})
        next_payment_date = data.get('next_payment_date')

        customer_email = customer_data.get('email')
        customer_code = customer_data.get('customer_code')
        plan_code = plan_data.get('plan_code')

        estate = Estate.objects.filter(user__email=customer_email).first()
        plan = SubscriptionPlan.objects.filter(paystack_plan_code=plan_code).first()
        if not estate or not plan:
            return Response({'status': 'ignored'}, status=200)

        # Prefer Paystack's next_payment_date, fallback to calculation
        next_date = parse_paystack_date(next_payment_date)
        if next_date is None:
            next_date = calculate_next_billing_date(plan)

        sub, created = EstateSubscription.objects.get_or_create(
            estate=estate,
            paystack_customer_code=customer_code,
            defaults={
                "paystack_subscription_code": subscription_code,
                "plan": plan,
                "status": "active",
                "next_billing_date": next_date
            }
        )
        if not created:
            sub.paystack_subscription_code = subscription_code
            sub.next_billing_date = next_date
            sub.status = "active"
            sub.save()
        
        print(f"Subscription {'created' if created else 'updated'} - Next billing: {next_date}")

    # ---------- PAYMENT SUCCESSFUL ----------
    elif event == 'invoice.payment_successful':
        subscription_data = data.get('subscription', {})
        subscription_code = subscription_data.get('subscription_code')
        customer_code = data.get('customer', {}).get('customer_code')

        sub = None
        if subscription_code:
            sub = EstateSubscription.objects.filter(paystack_subscription_code=subscription_code).first()
        if not sub and customer_code:
            sub = EstateSubscription.objects.filter(paystack_customer_code=customer_code).first()

        if sub:
            # Prefer Paystack's next_payment_date, fallback to calculation
            next_payment_date = subscription_data.get('next_payment_date')
            next_date = parse_paystack_date(next_payment_date)
            
            if next_date is None:
                # Calculate based on payment date if available
                paid_at = data.get('paid_at') or data.get('created_at')
                payment_date = parse_paystack_date(paid_at) if paid_at else datetime.datetime.now(datetime.timezone.utc)
                next_date = calculate_next_billing_date(sub.plan, payment_date)
            
            sub.next_billing_date = next_date
            sub.status = "active"
            sub.save()
            print(f"Payment successful - Next billing: {next_date}")

    # ---------- PAYMENT FAILED ----------
    elif event == 'invoice.payment_failed':
        subscription_code = data.get('subscription', {}).get('subscription_code')
        customer_code = data.get('customer', {}).get('customer_code')

        sub = None
        if subscription_code:
            sub = EstateSubscription.objects.filter(paystack_subscription_code=subscription_code).first()
        if not sub and customer_code:
            sub = EstateSubscription.objects.filter(paystack_customer_code=customer_code).first()

        if sub:
            sub.status = "past_due"
            sub.save()
            print(f"Payment failed for subscription {sub.id}")

    # ---------- SUBSCRIPTION DISABLE ----------
    elif event == 'subscription.disable':
        subscription_code = data.get('subscription_code')
        if subscription_code:
            sub = EstateSubscription.objects.filter(paystack_subscription_code=subscription_code).first()
            if sub:
                sub.status = "cancelled"
                sub.save()
                print(f"Subscription disabled: {sub.id}")

    else:
        print(f"Unhandled event type: {event}")

    return Response({'status': 'success'}, status=200)