import hmac
import hashlib
import datetime
from dateutil.relativedelta import relativedelta
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework import permissions
from .models import UserSubscription, SubscriptionPlan
from django.utils import timezone

User = get_user_model()


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

    # -------------------- HELPERS --------------------
    def get_subscription(subscription_code=None, customer_code=None, email=None):
        """Resolve subscription, preferring subscription_code > customer_code > email."""
        if subscription_code:
            sub = UserSubscription.objects.filter(paystack_subscription_code=subscription_code).first()
            if sub:
                return sub
        if customer_code:
            sub = UserSubscription.objects.filter(paystack_customer_code=customer_code).first()
            if sub:
                return sub
        if email:
            user = User.objects.filter(email=email).first()
            if user:
                return UserSubscription.objects.filter(user=user).order_by('-id').first()
        return None

    def set_user_active_state(user):
        """Update user.subscription_active depending on subs + grace period."""
        active_subs = UserSubscription.objects.filter(user=user, status="active")
        if active_subs.exists():
            user.subscription_active = True
        else:
            # If last cancelled sub still has time left, keep active
            last_sub = UserSubscription.objects.filter(user=user).order_by('-next_billing_date').first()
            if last_sub and last_sub.next_billing_date and last_sub.next_billing_date > timezone.now():
                user.subscription_active = True
            else:
                user.subscription_active = False
        user.save()

    # ---------- CHARGE SUCCESS (first payment OR renewal) ----------
    if event == 'charge.success':
        print(f"[WEBHOOK DEBUG] Processing charge.success event")
        plan_data = data.get('plan', {})
        print(f"[WEBHOOK DEBUG] plan_data: {plan_data}")

        customer_data = data.get('customer', {})
        authorization_data = data.get('authorization', {})

        subscription_code = data.get('subscription_code')
        plan_code = plan_data.get('plan_code') if plan_data else None
        customer_email = customer_data.get('email')
        customer_code = customer_data.get('customer_code')
        authorization_code = authorization_data.get('authorization_code')

        print(f"[WEBHOOK DEBUG] Extracted data - subscription_code: {subscription_code}, plan_code: {plan_code}, email: {customer_email}, customer_code: {customer_code}")

        user = User.objects.filter(email=customer_email).first()

        if not user:
            print(f"[WEBHOOK DEBUG] FAILURE - User not found - Email: {customer_email}")
            return Response({'status': 'ignored'}, status=200)

        # Check if this is a renewal (no plan_data) or first payment (has plan_data)
        if not plan_data or not plan_code:
            print(f"[WEBHOOK DEBUG] No plan_data - This is likely a RENEWAL payment")
            # For renewals, lookup existing subscription and use its plan
            sub = get_subscription(subscription_code, customer_code, customer_email)

            if sub and sub.plan:
                print(f"[WEBHOOK DEBUG] Found existing subscription {sub.id} with plan {sub.plan.name}")
                plan = sub.plan  # Use the existing plan

                # Payment date
                paid_at = data.get('paid_at') or data.get('created_at')
                payment_date = parse_paystack_date(paid_at) or datetime.datetime.now(datetime.timezone.utc)
                next_date = calculate_next_billing_date(plan, payment_date)

                print(f"[WEBHOOK DEBUG] Renewal - Calculated dates - payment_date: {payment_date}, next_date: {next_date}")

                # Update existing subscription
                sub.authorization_code = authorization_code or sub.authorization_code
                sub.status = 'active'
                sub.next_billing_date = next_date
                if subscription_code:
                    sub.paystack_subscription_code = subscription_code
                sub.save()
                print(f"[WEBHOOK DEBUG] SUCCESS - Updated subscription {sub.id} for renewal payment for {user.email}")

                set_user_active_state(user)
                print(f"[WEBHOOK DEBUG] Updated user active state for {user.email}")
                return Response({'status': 'success'}, status=200)
            else:
                print(f"[WEBHOOK DEBUG] FAILURE - No existing subscription found for renewal - Email: {customer_email}")
                return Response({'status': 'ignored'}, status=200)

        # First-time payment with plan_data
        plan = SubscriptionPlan.objects.filter(paystack_plan_code=plan_code).first()

        print(f"[WEBHOOK DEBUG] User found: {user is not None}, Plan found: {plan is not None}")

        if not plan:
            print(f"[WEBHOOK DEBUG] FAILURE - Plan not found - Plan: {plan_code}")
            print(f"[WEBHOOK DEBUG] Available plans: {list(SubscriptionPlan.objects.values_list('paystack_plan_code', flat=True))}")
            return Response({'status': 'ignored'}, status=200)

        # Payment date
        paid_at = data.get('paid_at') or data.get('created_at')
        payment_date = parse_paystack_date(paid_at) or datetime.datetime.now(datetime.timezone.utc)
        next_date = calculate_next_billing_date(plan, payment_date)

        print(f"[WEBHOOK DEBUG] First payment - Calculated dates - payment_date: {payment_date}, next_date: {next_date}")

        # Lookup by subscription_code (strict!)
        sub = get_subscription(subscription_code, customer_code, customer_email)

        print(f"[WEBHOOK DEBUG] Existing subscription found: {sub is not None}")

        if sub:
            print(f"[WEBHOOK DEBUG] Updating existing subscription {sub.id}")
            sub.authorization_code = authorization_code or sub.authorization_code
            sub.plan = plan
            sub.status = 'active'
            sub.next_billing_date = next_date
            if subscription_code:
                sub.paystack_subscription_code = subscription_code
            sub.save()
            print(f"[WEBHOOK DEBUG] SUCCESS - Updated subscription {sub.id} for {user.email}")
        else:
            print(f"[WEBHOOK DEBUG] Creating new subscription for {user.email}")
            try:
                new_sub = UserSubscription.objects.create(
                    user=user,
                    paystack_customer_code=customer_code,
                    paystack_subscription_code=subscription_code or '',
                    authorization_code=authorization_code or '',
                    plan=plan,
                    status='active',
                    next_billing_date=next_date
                )
                print(f"[WEBHOOK DEBUG] SUCCESS - Created subscription {new_sub.id} for {user.email}")
            except Exception as e:
                print(f"[WEBHOOK DEBUG] FAILURE - Error creating subscription: {str(e)}")
                raise

        set_user_active_state(user)
        print(f"[WEBHOOK DEBUG] Updated user active state for {user.email}")

    # ---------- SUBSCRIPTION CREATE ----------
    elif event == 'subscription.create':
        subscription_code = data.get('subscription_code')
        customer_data = data.get('customer', {})
        plan_data = data.get('plan', {})
        next_payment_date = data.get('next_payment_date')

        customer_email = customer_data.get('email')
        customer_code = customer_data.get('customer_code')
        plan_code = plan_data.get('plan_code')

        user = User.objects.filter(email=customer_email).first()
        plan = SubscriptionPlan.objects.filter(paystack_plan_code=plan_code).first()
        if not user or not plan:
            print(f"User or plan not found - Email: {customer_email}, Plan: {plan_code}")
            return Response({'status': 'ignored'}, status=200)

        next_date = parse_paystack_date(next_payment_date) or calculate_next_billing_date(plan)

        sub = get_subscription(subscription_code, customer_code, customer_email)

        if sub:
            sub.paystack_subscription_code = subscription_code
            sub.plan = plan
            sub.status = "active"
            sub.next_billing_date = next_date
            sub.save()
            print(f"Updated subscription {sub.id} for {user.email}")
        else:
            UserSubscription.objects.create(
                user=user,
                paystack_customer_code=customer_code,
                paystack_subscription_code=subscription_code,
                plan=plan,
                status="active",
                next_billing_date=next_date
            )
            print(f"Created subscription for {user.email}")

        set_user_active_state(user)

    # ---------- PAYMENT SUCCESSFUL ----------
    elif event == 'invoice.payment_successful':
        subscription_code = data.get('subscription', {}).get('subscription_code')
        customer_code = data.get('customer', {}).get('customer_code')
        customer_email = data.get('customer', {}).get('email')

        sub = get_subscription(subscription_code, customer_code, customer_email)

        if sub:
            next_payment_date = data.get('subscription', {}).get('next_payment_date')
            next_date = parse_paystack_date(next_payment_date)

            if not next_date:
                paid_at = data.get('paid_at') or data.get('created_at')
                payment_date = parse_paystack_date(paid_at) or datetime.datetime.now(datetime.timezone.utc)
                next_date = calculate_next_billing_date(sub.plan, payment_date)

            sub.next_billing_date = next_date
            sub.status = "active"
            sub.save()

            set_user_active_state(sub.user)
            print(f"Payment successful for {sub.user.email} - Next billing: {next_date}")
        else:
            print(f"No subscription found for payment successful - Email: {customer_email}")

    # ---------- PAYMENT FAILED ----------
    elif event == 'invoice.payment_failed':
        subscription_code = data.get('subscription', {}).get('subscription_code')
        customer_code = data.get('customer', {}).get('customer_code')
        customer_email = data.get('customer', {}).get('email')

        sub = get_subscription(subscription_code, customer_code, customer_email)

        if sub:
            sub.status = "past_due"
            sub.save()
            set_user_active_state(sub.user)
            print(f"Payment failed for {sub.user.email}")
        else:
            print(f"No subscription found for payment failed - Email: {customer_email}")

    # ---------- SUBSCRIPTION DISABLE ----------
    elif event == 'subscription.disable':
        subscription_code = data.get('subscription_code')
        customer_email = data.get('customer', {}).get('email')

        sub = get_subscription(subscription_code, None, customer_email)

        if sub:
            sub.status = "cancelled"
            sub.save()
            set_user_active_state(sub.user)
            print(f"Subscription disabled for {sub.user.email}")
        else:
            print(f"No subscription found for disable - Code: {subscription_code}")

    # ---------- SUBSCRIPTION ENABLE ----------
    elif event == 'subscription.enable':
        subscription_code = data.get('subscription_code')
        customer_email = data.get('customer', {}).get('email')

        sub = get_subscription(subscription_code, None, customer_email)

        if sub:
            sub.status = "active"
            next_payment_date = data.get('next_payment_date')
            if next_payment_date:
                sub.next_billing_date = parse_paystack_date(next_payment_date) or calculate_next_billing_date(sub.plan)
            sub.save()
            set_user_active_state(sub.user)
            print(f"Subscription enabled for {sub.user.email}")
        else:
            print(f"No subscription found for enable - Code: {subscription_code}")

    else:
        print(f"Unhandled event type: {event}")

    return Response({'status': 'success'}, status=200)
