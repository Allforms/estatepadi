# utils/push_notifications.py
"""
EstatePadi Push Notification Utilities

This module provides functions to send push notifications to users.
It integrates with your existing Notification model and creates push subscriptions.
"""

from django.conf import settings
from pywebpush import webpush, WebPushException
from django.utils import timezone
import json
import logging

logger = logging.getLogger(__name__)


def send_push_notification(user, title, message, notification_type='general', 
                          action_url=None, related_object_id=None, related_model=None):
    """
    Send push notification to a user and create notification record in database
    
    Args:
        user: User object to send notification to
        title (str): Notification title
        message (str): Notification message body
        notification_type (str): Type of notification (alert, payment, visitor, due, etc.)
        action_url (str, optional): URL to open when notification is clicked
        related_object_id (int, optional): ID of related object (e.g., payment_id, alert_id)
        related_model (str, optional): Model name of related object (e.g., 'DuePayment', 'Alert')
    
    Returns:
        dict: Status of push notification delivery containing:
            - success (bool): Whether any notifications were sent
            - success_count (int): Number of successful deliveries
            - failed_count (int): Number of failed deliveries
            - total (int): Total number of subscriptions attempted
            - notification_id (int): ID of created notification record
    
    Example:
        >>> from utils.push_notifications import send_push_notification
        >>> send_push_notification(
        ...     user=user,
        ...     title="Payment Approved",
        ...     message="Your payment has been approved!",
        ...     notification_type='payment',
        ...     action_url='/payments/123'
        ... )
    """
    from estates.models import Notification, PushSubscription
    
    # Create notification record in database
    notification = Notification.objects.create(
        recipient=user,
        title=title,
        message=message,
        notification_type=notification_type,
        action_url=action_url,
        related_object_id=related_object_id,
        related_model=related_model
    )
    
    # Get active push subscriptions for user
    subscriptions = PushSubscription.objects.filter(
        user=user,
        is_active=True
    )
    
    if not subscriptions.exists():
        logger.info(f"No active push subscriptions for user {user.email}")
        return {
            'success': False,
            'message': 'No active subscriptions',
            'success_count': 0,
            'failed_count': 0,
            'total': 0,
            'notification_id': notification.id
        }
    
    success_count = 0
    failed_count = 0
    
    # Map notification types to icons
    icon_map = {
        'alert': '/static/icons/alert-icon.png',
        'payment': '/static/icons/payment-icon.png',
        'visitor': '/static/icons/visitor-icon.png',
        'due': '/static/icons/due-icon.png',
        'resident': '/static/icons/resident-icon.png',
        'artisan': '/static/icons/artisan-icon.png',
        'announcement': '/static/icons/announcement-icon.png',
        'approval': '/static/icons/approval-icon.png',
        'general': '/static/icons/general-icon.png',
    }
    
    # Prepare push notification payload
    payload = {
        'title': title,
        'body': message,
        'icon': icon_map.get(notification_type, '/static/icons/estatepadi-icon.png'),
        'badge': '/static/icons/badge-icon.png',
        'url': action_url or '/',
        'notification_id': notification.id,
        'notification_type': notification_type,
        'vibrate': [200, 100, 200],
        'requireInteraction': notification_type == 'alert',  # Keep alert visible until user interacts
        'tag': f'estatepadi-{notification.id}',  # Group notifications
    }
    
    # Send to all user's subscriptions
    for sub in subscriptions:
        try:
            subscription_info = {
                'endpoint': sub.endpoint,
                'keys': {
                    'auth': sub.auth,
                    'p256dh': sub.p256dh
                }
            }
            
            webpush(
                subscription_info=subscription_info,
                data=json.dumps(payload),
                vapid_private_key=settings.WEBPUSH_SETTINGS['VAPID_PRIVATE_KEY'],
                vapid_claims={
                    "sub": f"mailto:{settings.WEBPUSH_SETTINGS['VAPID_ADMIN_EMAIL']}"
                }
            )
            success_count += 1
            logger.info(f"Push notification sent to {user.email} via {sub.device_type}")
            
        except WebPushException as e:
            failed_count += 1
            logger.error(f"WebPush error for {user.email}: {str(e)}")
            
            # Handle expired subscriptions
            if e.response and e.response.status_code == 410:
                logger.info(f"Subscription expired for {user.email}, deactivating...")
                sub.is_active = False
                sub.save()
                
        except Exception as e:
            failed_count += 1
            logger.error(f"Unexpected error sending push to {user.email}: {str(e)}")
    
    # Update notification status if at least one delivery succeeded
    if success_count > 0:
        notification.is_push_sent = True
        notification.push_sent_at = timezone.now()
        notification.save()
        logger.info(f"Notification {notification.id} marked as sent")
    
    return {
        'success': success_count > 0,
        'success_count': success_count,
        'failed_count': failed_count,
        'total': subscriptions.count(),
        'notification_id': notification.id
    }


def notify_estate_admins(estate, title, message, notification_type='general', 
                        action_url=None, related_object_id=None, related_model=None,
                        exclude_user=None, roles=None):
    """
    Send push notification to all admins and security personnel of an estate
    
    Args:
        estate: Estate object
        title (str): Notification title
        message (str): Notification message
        notification_type (str): Type of notification
        action_url (str, optional): URL to open when notification is clicked
        related_object_id (int, optional): ID of related object
        related_model (str, optional): Model name of related object
        exclude_user (User, optional): User to exclude from notifications (e.g., the sender)
    
    Returns:
        dict: Aggregated status of all notifications
    
    Example:
        >>> from utils.push_notifications import notify_estate_admins
        >>> notify_estate_admins(
        ...     estate=estate,
        ...     title="New Payment Evidence",
        ...     message="John Doe submitted payment evidence",
        ...     notification_type='payment',
        ...     action_url='/admin/payments/123'
        ... )
    """
    from estates.models import User

    # default to admins roles not provided
    if roles is None:
        roles = ['admin']
    
    # Get all admin and security users for the estate
    admin_users = User.objects.filter(
        estate=estate,
        role__in=roles,
        is_approved=True
    )
    
    if exclude_user:
        admin_users = admin_users.exclude(id=exclude_user.id)
    
    if not admin_users.exists():
        logger.warning(f"No admin users found for estate {estate.name}")
        return {
            'success': False,
            'total_admins': 0,
            'total_success': 0,
            'total_failed': 0,
            'results': []
        }
    
    results = []
    for admin in admin_users:
        result = send_push_notification(
            user=admin,
            title=title,
            message=message,
            notification_type=notification_type,
            action_url=action_url,
            related_object_id=related_object_id,
            related_model=related_model
        )
        results.append(result)
    
    total_success = sum(r['success_count'] for r in results)
    total_failed = sum(r['failed_count'] for r in results)
    
    logger.info(f"Notified {admin_users.count()} admins for estate {estate.name}")
    
    return {
        'success': total_success > 0,
        'total_admins': admin_users.count(),
        'total_success': total_success,
        'total_failed': total_failed,
        'results': results
    }


def notify_all_residents(estate, title, message, notification_type='announcement',
                        action_url=None, exclude_user=None):
    """
    Send push notification to all approved residents of an estate
    
    Args:
        estate: Estate object
        title (str): Notification title
        message (str): Notification message
        notification_type (str): Type of notification (default: 'announcement')
        action_url (str, optional): URL to open when notification is clicked
        exclude_user (User, optional): User to exclude from notifications
    
    Returns:
        dict: Aggregated status of all notifications
    
    Example:
        >>> from utils.push_notifications import notify_all_residents
        >>> notify_all_residents(
        ...     estate=estate,
        ...     title="Estate Meeting Tomorrow",
        ...     message="Mandatory meeting at 5 PM in the clubhouse",
        ...     notification_type='announcement',
        ...     action_url='/announcements/123'
        ... )
    """
    from estates.models import User
    
    residents = User.objects.filter(
        estate=estate,
        is_approved=True
    )
    
    if exclude_user:
        residents = residents.exclude(id=exclude_user.id)
    
    if not residents.exists():
        logger.warning(f"No residents found for estate {estate.name}")
        return {
            'success': False,
            'total_residents': 0,
            'total_success': 0,
            'total_failed': 0
        }
    
    results = []
    for resident in residents:
        result = send_push_notification(
            user=resident,
            title=title,
            message=message,
            notification_type=notification_type,
            action_url=action_url
        )
        results.append(result)
    
    total_success = sum(r['success_count'] for r in results)
    total_failed = sum(r['failed_count'] for r in results)
    
    logger.info(f"Notified {residents.count()} residents for estate {estate.name}")
    
    return {
        'success': total_success > 0,
        'total_residents': residents.count(),
        'total_success': total_success,
        'total_failed': total_failed
    }


def notify_specific_users(users, title, message, notification_type='general', action_url=None):
    """
    Send push notification to a specific list of users
    
    Args:
        users: QuerySet or list of User objects
        title (str): Notification title
        message (str): Notification message
        notification_type (str): Type of notification
        action_url (str, optional): URL to open when notification is clicked
    
    Returns:
        dict: Aggregated status of all notifications
    
    Example:
        >>> tenants = User.objects.filter(estate=estate, resident_type='tenant')
        >>> notify_specific_users(
        ...     users=tenants,
        ...     title="Rent Due Reminder",
        ...     message="Your rent is due in 3 days",
        ...     notification_type='due',
        ...     action_url='/payments'
        ... )
    """
    results = []
    for user in users:
        result = send_push_notification(
            user=user,
            title=title,
            message=message,
            notification_type=notification_type,
            action_url=action_url
        )
        results.append(result)
    
    total_success = sum(r['success_count'] for r in results)
    total_failed = sum(r['failed_count'] for r in results)
    
    return {
        'success': total_success > 0,
        'total_users': len(users),
        'total_success': total_success,
        'total_failed': total_failed
    }


def get_user_subscriptions(user):
    """
    Get all active push subscriptions for a user
    
    Args:
        user: User object
    
    Returns:
        QuerySet: Active PushSubscription objects
    """
    from estates.models import PushSubscription
    return PushSubscription.objects.filter(user=user, is_active=True)


def deactivate_user_subscriptions(user):
    """
    Deactivate all push subscriptions for a user
    
    Args:
        user: User object
    
    Returns:
        int: Number of subscriptions deactivated
    """
    from estates.models import PushSubscription
    count = PushSubscription.objects.filter(user=user, is_active=True).update(is_active=False)
    logger.info(f"Deactivated {count} subscriptions for user {user.email}")
    return count


def cleanup_expired_subscriptions():
    """
    Clean up subscriptions that haven't been active for 90+ days
    This can be run as a periodic task (e.g., celery beat)
    
    Returns:
        int: Number of subscriptions cleaned up
    """
    from estates.models import PushSubscription
    from datetime import timedelta
    
    cutoff_date = timezone.now() - timedelta(days=90)
    count = PushSubscription.objects.filter(
        updated_at__lt=cutoff_date
    ).delete()[0]
    
    logger.info(f"Cleaned up {count} old subscriptions")
    return count
    