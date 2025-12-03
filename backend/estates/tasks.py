from celery import shared_task
from django.utils import timezone
from django.conf import settings
from django.core.mail import EmailMultiAlternatives, send_mail
from django.template.loader import render_to_string
from .models import VisitorCode, UserSubscription, SubscriptionPlan, UserSubscriptionHistory
import requests
from django.contrib.auth import get_user_model
import logging
from collections import defaultdict

try:
    from twilio.rest import Client
    TWILIO_AVAILABLE = True
except ImportError:
    TWILIO_AVAILABLE = False
    logging.warning("Twilio not installed. SMS notifications will be skipped.")

User = get_user_model()
logger = logging.getLogger(__name__)

PAYSTACK_SECRET_KEY = settings.PAYSTACK_SECRET_KEY
PAYSTACK_BASE_URL = "https://api.paystack.co"

@shared_task
def cleanup_expired_codes():
    expired_codes = VisitorCode.objects.filter(
        expires_at__lt=timezone.now(),
        is_used=False
    )
    count = expired_codes.count()
    expired_codes.delete()
    return f"Cleaned up {count} expired visitor codes"


@shared_task
def send_account_approved_email(email, first_name):
    subject = 'Your Estate Account Has Been Approved'
    from_email = settings.DEFAULT_FROM_EMAIL
    to = [email]

    context = {
        'first_name': first_name,
        'current_year': timezone.now().year,
        'login_url': 'https://estatepadi.com/login', 
        "support_email": settings.DEFAULT_FROM_EMAIL,
        'support_phone': '08137343312'
    }

    html_content = render_to_string('estates/account_approved.html', context)
    text_content = f"Hi {first_name},\n\nYour estate account has been approved."

    msg = EmailMultiAlternatives(subject, text_content, from_email, to)
    msg.attach_alternative(html_content, "text/html")
    msg.send()


@shared_task
def send_payment_approved_email(recipient_email, resident_name, due_title, amount, approved_by):
    subject = "Your Payment Has Been Approved"
    from_email = settings.DEFAULT_FROM_EMAIL
    to = [recipient_email]

    context = {
        'first_name': resident_name,
        'due_title': due_title,
        'amount': amount,
        'approved_by': approved_by,
        'current_year': timezone.now().year,
    }

    html_content = render_to_string('estates/payment_approved.html', context)
    text_content = f"Hi {resident_name},\n\nYour payment for '{due_title}' has been approved."

    msg = EmailMultiAlternatives(subject, text_content, from_email, to)
    msg.attach_alternative(html_content, "text/html")
    msg.send()



@shared_task
def sync_subscriptions_from_paystack():
    headers = {"Authorization": f"Bearer {PAYSTACK_SECRET_KEY}"}
    results = []

    # Step 1: Fetch all subscriptions
    url = f"{PAYSTACK_BASE_URL}/subscription"
    resp = requests.get(url, headers=headers)

    if resp.status_code != 200:
        return {"error": "Failed to fetch subscriptions from Paystack", "response": resp.text}

    subscriptions = resp.json().get("data", [])

    # Step 2: Also fetch recent successful transactions to catch missed webhook events
    transactions_url = f"{PAYSTACK_BASE_URL}/transaction"
    transactions_params = {"status": "success", "perPage": 100}  # Fetch last 100 successful transactions
    trans_resp = requests.get(transactions_url, headers=headers, params=transactions_params)

    successful_transactions = []
    if trans_resp.status_code == 200:
        successful_transactions = trans_resp.json().get("data", [])
        print(f"[SYNC] Found {len(successful_transactions)} successful transactions from Paystack")
    else:
        print(f"[SYNC] Failed to fetch transactions: {trans_resp.text}")

    # Process successful transactions that have plan data (subscription payments)
    for transaction in successful_transactions:
        plan_data = transaction.get("plan")
        if not plan_data:
            print(f"[SYNC] Transaction {transaction.get('reference')} has no plan data - skipping")
            continue  # Skip non-subscription transactions

        customer_data = transaction.get("customer", {})
        customer_email = customer_data.get("email")
        plan_code = plan_data.get("plan_code")

        print(f"[SYNC] Processing transaction {transaction.get('reference')} - email: {customer_email}, plan_code: {plan_code}")

        if not customer_email or not plan_code:
            print(f"[SYNC] Missing email or plan_code - skipping")
            continue

        try:
            user = User.objects.get(email=customer_email)
            plan = SubscriptionPlan.objects.filter(paystack_plan_code=plan_code).first()

            if not plan:
                print(f"[SYNC] Plan not found for code: {plan_code}")
                continue

            # Check if this transaction was already processed
            existing_sub = UserSubscription.objects.filter(user=user).first()

            # Calculate next billing date from transaction date
            from dateutil.relativedelta import relativedelta
            import datetime

            paid_at = transaction.get("paid_at") or transaction.get("created_at")
            if paid_at:
                # Parse Paystack date
                try:
                    if paid_at.endswith('Z'):
                        paid_at = paid_at.replace('Z', '+00:00')
                    payment_date = datetime.datetime.fromisoformat(paid_at)
                except:
                    payment_date = datetime.datetime.now(datetime.timezone.utc)
            else:
                payment_date = datetime.datetime.now(datetime.timezone.utc)

            # Calculate next billing based on plan interval
            if plan.interval == 'monthly':
                next_date = payment_date + relativedelta(months=1)
            elif plan.interval == 'yearly':
                next_date = payment_date + relativedelta(years=1)
            else:
                next_date = payment_date + relativedelta(months=1)

            # Create or update subscription
            subscription_code = transaction.get("subscription", {}).get("subscription_code") if transaction.get("subscription") else ""
            customer_code = customer_data.get("customer_code")
            authorization_code = transaction.get("authorization", {}).get("authorization_code")

            UserSubscription.objects.update_or_create(
                user=user,
                defaults={
                    "plan": plan,
                    "paystack_subscription_code": subscription_code or existing_sub.paystack_subscription_code if existing_sub else "",
                    "paystack_customer_code": customer_code,
                    "status": "active",
                    "next_billing_date": next_date,
                    "authorization_code": authorization_code,
                    "updated_at": timezone.now(),
                }
            )

            # Update user active state
            user.subscription_active = True
            user.save()

            print(f"[SYNC] Processed transaction for {customer_email} - Plan: {plan.name}")
            results.append({
                "email": customer_email,
                "status": "synced from transaction",
                "transaction_reference": transaction.get("reference"),
                "plan": plan.name
            })

        except User.DoesNotExist:
            print(f"[SYNC] User not found for email: {customer_email}")
            continue
        except Exception as e:
            print(f"[SYNC] Error processing transaction: {str(e)}")
            continue

    # Group subs by email
    user_subs = defaultdict(list)
    for sub in subscriptions:
        email = sub.get("customer", {}).get("email")
        if email:
            user_subs[email].append(sub)

    for email, subs in user_subs.items():
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            results.append({"email": email, "status": "skipped (user not found)"})
            continue

        # pick the "best" sub for main record
        chosen_sub = None
        # preference order: active > non-renewing > cancelled
        for s in subs:
            if s.get("status") == "active":
                chosen_sub = s
                break
        if not chosen_sub:
            for s in subs:
                if s.get("status") == "non-renewing":
                    chosen_sub = s
                    break
        if not chosen_sub:
            chosen_sub = subs[0]  # fallback (likely cancelled)

        # map plan
        plan_code = chosen_sub.get("plan", {}).get("plan_code")
        plan = SubscriptionPlan.objects.filter(paystack_plan_code=plan_code).first() if plan_code else None

        # update main record with chosen sub
        local_sub, _ = UserSubscription.objects.update_or_create(
            user=user,
            defaults={
                "plan": plan,
                "paystack_subscription_code": chosen_sub.get("subscription_code"),
                "paystack_customer_code": chosen_sub.get("customer", {}).get("customer_code"),
                "status": chosen_sub.get("status"),
                "next_billing_date": chosen_sub.get("next_payment_date"),
                "authorization_code": chosen_sub.get("authorization", {}).get("authorization_code"),
                "email_token": chosen_sub.get("email_token"),
                "updated_at": timezone.now(),
            }
        )

        # add *all* subs to history
        for s in subs:
            plan_code = s.get("plan", {}).get("plan_code")
            plan = SubscriptionPlan.objects.filter(paystack_plan_code=plan_code).first() if plan_code else None

            UserSubscriptionHistory.objects.create(
                user=user,
                plan=plan,
                paystack_subscription_code=s.get("subscription_code"),
                status=s.get("status"),
                next_billing_date=s.get("next_payment_date"),
                authorization_code=s.get("authorization", {}).get("authorization_code"),
                email_token=s.get("email_token"),
            )

        results.append({
            "user": user.email,
            "chosen_status": local_sub.status,
            "total_subs": len(subs),
        })

    return {"results": results}



@shared_task(bind=True, max_retries=3)
def send_due_payment_notification(self, payment_id):
    """
    Send email and SMS notifications to estate admins when a resident submits payment evidence.
    """
    try:
        from estates.models import DuePayment
        # Get the payment instance
        try:
            payment = DuePayment.objects.select_related(
                'resident', 'due', 'due__estate'
            ).get(id=payment_id)
        except DuePayment.DoesNotExist:
            logger.error(f"DuePayment with ID {payment_id} not found")
            return f"Payment {payment_id} not found"

        # Get all admins for the estate
        estate_admins = User.objects.filter(
            estate=payment.due.estate,
            role='admin',
            is_active=True
        )

        if not estate_admins.exists():
            logger.warning(f"No active admins found for estate {payment.due.estate.name}")
            return f"No admins found for estate {payment.due.estate.name}"

        # Prepare notification data
        from datetime import datetime
        
        context = {
            'resident_name': f"{payment.resident.first_name} {payment.resident.last_name}",
            'resident_email': payment.resident.email,
            'due_title': payment.due.title,
            'amount': payment.due.amount,
            'estate_name': payment.due.estate.name,
            'current_year': datetime.now().year,
        }

        success_count = 0
        failed_notifications = []

        for admin in estate_admins:
            try:
                # Send email notification
                email_sent = send_email_notification(admin, context)
                
                # Send SMS notification if phone number exists
                sms_sent = True
                if hasattr(admin, 'phone_number') and admin.phone_number:
                    sms_sent = send_sms_notification(admin, context)
                
                if email_sent:
                    success_count += 1
                    logger.info(f"Notification sent successfully to admin {admin.email}")
                else:
                    failed_notifications.append(admin.email)
                    
            except Exception as e:
                logger.error(f"Failed to send notification to admin {admin.email}: {str(e)}")
                failed_notifications.append(admin.email)

        # Log results
        result_message = f"Notifications sent to {success_count}/{estate_admins.count()} admins"
        if failed_notifications:
            result_message += f". Failed: {', '.join(failed_notifications)}"
            
        logger.info(result_message)
        return result_message

    except Exception as e:
        logger.error(f"Error in send_due_payment_notification task: {str(e)}")
        
        # Retry the task with exponential backoff
        try:
            self.retry(countdown=60 * (2 ** self.request.retries))
        except self.MaxRetriesExceededError:
            logger.error(f"Max retries exceeded for payment notification {payment_id}")
            return f"Failed to send notifications after max retries: {str(e)}"


def send_email_notification(admin, context):
    """Send email notification to admin."""
    try:
        subject = f"New Payment Submission - {context['due_title']}"
        
        # Create both HTML and plain text versions
        html_message = render_to_string('estates/payment_notification.html', {
            'admin_name': f"{admin.first_name} {admin.last_name}",
            **context
        })
        
        plain_message = render_to_string('estates/payment_notification.txt', {
            'admin_name': f"{admin.first_name} {admin.last_name}",
            **context
        })

        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[admin.email],
            html_message=html_message,
            fail_silently=False,
        )
        return True
        
    except Exception as e:
        logger.error(f"Email sending failed for {admin.email}: {str(e)}")
        return False


def send_sms_notification(admin, context):
    """Send SMS notification to admin."""
    if not TWILIO_AVAILABLE:
        logger.warning("SMS notification skipped - Twilio not available")
        return True  # Don't fail the task if SMS is not configured
        
    try:
        # Configure Twilio client
        client = Client(
            settings.TWILIO_ACCOUNT_SID, 
            settings.TWILIO_AUTH_TOKEN
        )
        
        # Create SMS message
        message_body = (
            f"New payment submitted by {context['resident_name']} "
            f"for {context['due_title']} (₦{context['amount']}). "
            f"Estate: {context['estate_name']}. Please review in admin portal."
        )
        
        message = client.messages.create(
            body=message_body,
            from_=settings.TWILIO_PHONE_NUMBER,
            to=admin.phone_number
        )
        
        logger.info(f"SMS sent to {admin.phone_number}, SID: {message.sid}")
        return True
        
    except Exception as e:
        logger.error(f"SMS sending failed for {admin.phone_number}: {str(e)}")
        return False


#tasks for sending Alert
@shared_task(bind=True, max_retries=3)
def send_email_alert(self, recipient_email, alert_id):
    """
    Send an estate alert to a recipient by email.
    """
    from estates.models import Alert  
    try:
        alert = Alert.objects.get(id=alert_id)
        subject = f"[{alert.estate.name}] {alert.alert_type}"

        context = {
            "sender_name": f"{alert.sender.first_name} {alert.sender.last_name}",
            "sender_role": alert.sender.role,
            "estate_name": alert.estate.name,
            "subject": alert.alert_type,
            "message": alert.other_reason,
            "current_year": timezone.now().year,
        }

        html_message = render_to_string("estates/alert_email.html", context)
        plain_message = render_to_string("estates/alert_email.txt", context)

        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient_email],
            html_message=html_message,
            fail_silently=False,
        )
        return f"Alert email sent to {recipient_email}"

    except Alert.DoesNotExist:
        logger.error(f"Alert with ID {alert_id} not found")
        return f"Alert {alert_id} not found"
    except Exception as e:
        logger.error(f"Email alert sending failed for {recipient_email}: {str(e)}")
        try:
            self.retry(countdown=60 * (2 ** self.request.retries))
        except self.MaxRetriesExceededError:
            return f"Failed to send email alert to {recipient_email} after retries"


@shared_task(bind=True, max_retries=3)
def send_sms_alert(self, recipient_phone, alert_id):
    """
    Send an estate alert to a recipient by SMS.
    """
    from estates.models import Alert  
    if not TWILIO_AVAILABLE:
        logger.warning("SMS alert skipped - Twilio not installed")
        return f"Skipped SMS to {recipient_phone}"

    try:
        alert = Alert.objects.get(id=alert_id)
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)

        message_body = (
            f"[{alert.estate.name}] ALERT\n"
            f"From: {alert.sender.first_name} {alert.sender.last_name} ({alert.sender.role})\n"
            f"{alert.alert_type}: {alert.other_reason}"
        )

        message = client.messages.create(
            body=message_body,
            from_=settings.TWILIO_PHONE_NUMBER,
            to=recipient_phone
        )
        logger.info(f"SMS alert sent to {recipient_phone}, SID: {message.sid}")
        return f"Alert SMS sent to {recipient_phone}"

    except Alert.DoesNotExist:
        logger.error(f"Alert with ID {alert_id} not found for SMS")
        return f"Alert {alert_id} not found"
    except Exception as e:
        logger.error(f"SMS alert sending failed for {recipient_phone}: {str(e)}")
        try:
            self.retry(countdown=60 * (2 ** self.request.retries))
        except self.MaxRetriesExceededError:
            return f"Failed to send SMS alert to {recipient_phone} after retries"
