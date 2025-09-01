from celery import shared_task
from django.utils import timezone
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from .models import VisitorCode, EstateSubscription
import requests

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

    for sub in EstateSubscription.objects.all():
        url = f"{PAYSTACK_BASE_URL}/customer/{sub.paystack_customer_code}"
        resp = requests.get(url, headers=headers)

        if resp.status_code == 200:
            data = resp.json().get("data", {})
            subscriptions = data.get("subscriptions", [])

            if subscriptions:
                latest_sub = subscriptions[0]
                sub.status = latest_sub.get("status", sub.status)
                sub.next_billing_date = latest_sub.get("next_payment_date") or sub.next_billing_date
                sub.authorization_code = latest_sub.get("authorization", {}).get("authorization_code", sub.authorization_code)
                sub.email_token = latest_sub.get("email_token", sub.email_token)
                sub.updated_at = timezone.now()
                sub.save()

                results.append({
                    "estate": sub.estate.name,
                    "status": sub.status,
                    "next_billing_date": sub.next_billing_date
                })
            else:
                results.append({
                    "estate": sub.estate.name,
                    "status": None,
                    "message": "No subscriptions found for customer"
                })
        else:
            results.append({
                "estate": sub.estate.name,
                "status": None,
                "message": "Failed to fetch from Paystack"
            })

    return results
