# estates/signals.py
from django.db.models.signals import post_save, pre_save, post_delete
from django.dispatch import receiver
from django.utils import timezone
from threading import current_thread
from .models import (
    Alert, DuePayment, VisitorCode, User,
    ArtisanOrDomesticStaff, Announcement, Due, AuditLog
)
from .utils.push_notification import (
    send_push_notification,
    notify_all_residents,
    notify_estate_admins
)


# ============================================
# AUDIT LOG FUNCTIONALITY
# ============================================

def get_client_ip(request):
    """Get client IP from request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR', '127.0.0.1')
    return ip


# Store original values before save to detect changes
_pre_save_instances = {}


@receiver(pre_save)
def store_pre_save_instance(sender, instance, **kwargs):
    """Store the original instance before save to detect changes"""
    # Only track models in the estates app, exclude AuditLog itself
    if sender._meta.app_label == 'estates' and sender.__name__ != 'AuditLog':
        if instance.pk:
            try:
                old_instance = sender.objects.get(pk=instance.pk)
                key = f"{sender.__name__}_{instance.pk}"
                _pre_save_instances[key] = old_instance
            except sender.DoesNotExist:
                pass


@receiver(post_save)
def log_model_save(sender, instance, created, **kwargs):
    """Log create and update actions for audit trail"""
    # Only track models in the estates app, exclude AuditLog itself
    if sender._meta.app_label == 'estates' and sender.__name__ != 'AuditLog':
        # Get the user from thread-local storage (set in middleware)
        request = getattr(current_thread(), 'request', None)

        if not request or not hasattr(request, 'user') or not request.user.is_authenticated:
            return

        action = 'created' if created else 'updated'
        changes = {}

        if not created:
            # Get changes by comparing old and new values
            key = f"{sender.__name__}_{instance.pk}"
            old_instance = _pre_save_instances.get(key)

            if old_instance:
                for field in instance._meta.fields:
                    field_name = field.name

                    # Skip sensitive fields
                    if field_name in ['password', 'password_reset_code', 'verification_code']:
                        continue

                    old_value = getattr(old_instance, field_name, None)
                    new_value = getattr(instance, field_name, None)

                    # Only log if value actually changed
                    if old_value != new_value:
                        changes[field_name] = {
                            'old': str(old_value) if old_value is not None else None,
                            'new': str(new_value) if new_value is not None else None
                        }

                # Clean up stored instance
                if key in _pre_save_instances:
                    del _pre_save_instances[key]
        else:
            # For created objects, log key information
            changes = {
                'action': 'Object created',
                'object': str(instance)
            }

        # Only create audit log if there are changes or it's a creation
        if changes or created:
            try:
                AuditLog.objects.create(
                    user=request.user,
                    action=action,
                    model_name=sender.__name__,
                    object_id=instance.pk,
                    changes=changes,
                    ip_address=get_client_ip(request)
                )
            except Exception as e:
                # Don't break the request if audit logging fails
                print(f"[AUDIT LOG ERROR] Failed to create audit log: {e}")


@receiver(post_delete)
def log_model_delete(sender, instance, **kwargs):
    """Log delete actions for audit trail"""
    # Only track models in the estates app, exclude AuditLog itself
    if sender._meta.app_label == 'estates' and sender.__name__ != 'AuditLog':
        request = getattr(current_thread(), 'request', None)

        if not request or not hasattr(request, 'user') or not request.user.is_authenticated:
            return

        try:
            AuditLog.objects.create(
                user=request.user,
                action='deleted',
                model_name=sender.__name__,
                object_id=instance.pk,
                changes={
                    'deleted_object': str(instance),
                    'action': 'Object deleted'
                },
                ip_address=get_client_ip(request)
            )
        except Exception as e:
            # Don't break the request if audit logging fails
            print(f"[AUDIT LOG ERROR] Failed to create audit log: {e}")


# ============================================
# NOTIFICATION SIGNALS
# ============================================


@receiver(post_save, sender=Alert)
def notify_alert_created(sender, instance, created, **kwargs):
    """Send emergency alert notification based on who created it"""
    if created:
        alert_type_display = instance.get_alert_type_display()
        message = f"🚨 EMERGENCY: {alert_type_display} reported by {instance.sender.get_full_name() or instance.sender.email}"

        if instance.other_reason:
            message += f"\nDetails: {instance.other_reason}"

        # Determine recipient roles based on sender's role
        if instance.sender.role == "resident":
            recipient_roles = ['admin', 'security']
        elif instance.sender.role == "admin":
            recipient_roles = ['resident', 'security']
        elif instance.sender.role == "security":
            recipient_roles = ['resident', 'admin']
        else:
            recipient_roles = []

        # Notify recipients if there are any
        if recipient_roles:
            notify_estate_admins(
                estate=instance.estate,
                title=f"🚨 Emergency Alert: {alert_type_display}",
                message=message,
                notification_type='alert',
                action_url=f'/alerts/{instance.id}',
                related_object_id=instance.id,
                related_model='Alert',
                exclude_user=instance.sender,
                roles=recipient_roles
            )

        # Also notify the sender that their alert was received
        send_push_notification(
            user=instance.sender,
            title="Alert Received",
            message=f"Your {alert_type_display} alert has been sent to estate security and admins.",
            notification_type='alert',
            action_url=f'/alerts/{instance.id}',
            related_object_id=instance.id,
            related_model='Alert'
        )


# Store the old status before save
@receiver(pre_save, sender=DuePayment)
def store_previous_status(sender, instance, **kwargs):
    """Store the previous status before saving"""
    if instance.pk:  # Only for existing objects (updates)
        try:
            old_instance = DuePayment.objects.get(pk=instance.pk)
            instance._old_status = old_instance.status
        except DuePayment.DoesNotExist:
            instance._old_status = None
    else:
        instance._old_status = None


@receiver(post_save, sender=DuePayment)
def notify_payment_status(sender, instance, created, **kwargs):
    """Notify resident about payment submission and status changes"""
    
    if created:
        # Notify resident that payment evidence was submitted
        send_push_notification(
            user=instance.resident,
            title="Payment Evidence Submitted",
            message=f"Your payment of ₦{instance.amount_paid:,.2f} for '{instance.due.title}' has been submitted for review.",
            notification_type='payment',
            action_url=f'/payments/{instance.id}',
            related_object_id=instance.id,
            related_model='DuePayment'
        )
        
        # Notify admins about new payment evidence
        notify_estate_admins(
            estate=instance.due.estate,
            title="New Payment Evidence",
            message=f"{instance.resident.get_full_name() or instance.resident.email} submitted payment for '{instance.due.title}' - ₦{instance.amount_paid:,.2f}",
            notification_type='payment',
            action_url=f'/admin/payments/{instance.id}',
            related_object_id=instance.id,
            related_model='DuePayment'
        )
    
    else:
        # Check if status changed using the stored old status
        old_status = getattr(instance, '_old_status', None)
        
        if old_status and old_status != instance.status:
            print(f"Status changed from {old_status} to {instance.status}")  # Debug log
            
            if instance.status == 'approved':
                send_push_notification(
                    user=instance.resident,
                    title="Payment Approved ✅",
                    message=f"Your payment of ₦{instance.amount_paid:,.2f} for '{instance.due.title}' has been approved!",
                    notification_type='payment',
                    action_url=f'/payments/{instance.id}',
                    related_object_id=instance.id,
                    related_model='DuePayment'
                )
            
            elif instance.status == 'rejected':
                rejection_reason = instance.admin_notes or "No reason provided"
                send_push_notification(
                    user=instance.resident,
                    title="Payment Rejected ❌",
                    message=f"Your payment for '{instance.due.title}' was rejected. Reason: {rejection_reason}",
                    notification_type='payment',
                    action_url=f'/payments/{instance.id}',
                    related_object_id=instance.id,
                    related_model='DuePayment'
                )


@receiver(post_save, sender=VisitorCode)
def notify_visitor_code_created(sender, instance, created, **kwargs):
    """Notify security about new visitor code"""
    if created:
        notify_estate_admins(
            estate=instance.resident.estate,
            title="New Visitor Code Generated",
            message=f"Visitor: {instance.visitor_name}\nCode: {instance.code}\nResident: {instance.resident.get_full_name() or instance.resident.email}",
            notification_type='visitor',
            action_url=f'/visitors/verify',
            related_object_id=instance.id,
            related_model='VisitorCode',
            exclude_user=instance.resident
        )


@receiver(post_save, sender=VisitorCode)
def notify_visitor_code_used(sender, instance, **kwargs):
    """Notify resident when their visitor code is used"""
    if instance.is_used and instance.used_at:
        # Check if this is a recent use (within last 5 seconds)
        time_diff = timezone.now() - instance.used_at
        if time_diff.total_seconds() < 5:
            send_push_notification(
                user=instance.resident,
                title="Visitor Arrived ✅",
                message=f"{instance.visitor_name} has checked in at the gate using your visitor code.",
                notification_type='visitor',
                action_url=f'/visitors/{instance.id}',
                related_object_id=instance.id,
                related_model='VisitorCode'
            )


@receiver(post_save, sender=User)
def notify_new_resident(sender, instance, created, **kwargs):
    """Notify admins about new resident registration"""
    if created and instance.role == 'resident' and instance.estate:
        notify_estate_admins(
            estate=instance.estate,
            title="New Resident Registration",
            message=f"{instance.get_full_name() or instance.email} has registered as a {instance.get_resident_type_display() or 'resident'}. Please review and approve.",
            notification_type='resident',
            action_url=f'/admin/residents/{instance.id}',
            related_object_id=instance.id,
            related_model='User'
        )


@receiver(pre_save, sender=User)
def notify_resident_approval(sender, instance, **kwargs):
    """Notify resident when their account is approved"""
    if instance.pk:
        try:
            old_instance = User.objects.get(pk=instance.pk)
            # Check if is_approved changed from False to True
            if not old_instance.is_approved and instance.is_approved:
                send_push_notification(
                    user=instance,
                    title="Account Approved! 🎉",
                    message=f"Welcome to {instance.estate.name}! Your account has been approved. You can now access all features.",
                    notification_type='approval',
                    action_url='/dashboard'
                )
        except User.DoesNotExist:
            pass


@receiver(post_save, sender=ArtisanOrDomesticStaff)
def notify_artisan_registered(sender, instance, created, **kwargs):
    """Notify admins about new artisan/domestic staff registration"""
    if created:
        notify_estate_admins(
            estate=instance.estate,
            title="New Artisan/Domestic Staff",
            message=f"{instance.name} ({instance.role}) has been registered by {instance.resident.get_full_name() or instance.resident.email}. ID: {instance.unique_id}",
            notification_type='artisan',
            action_url=f'/artisans/{instance.id}',
            related_object_id=instance.id,
            related_model='ArtisanOrDomesticStaff',
            exclude_user=instance.resident
        )


@receiver(post_save, sender=Announcement)
def notify_announcement_created(sender, instance, created, **kwargs):
    """Send announcement to all estate residents"""
    if created:
        notify_all_residents(
            estate=instance.estate,
            title=f"📢 {instance.title}",
            message=instance.message[:200],  # First 200 characters
            notification_type='announcement',
            action_url=f'/announcements/{instance.id}',
            exclude_user=instance.created_by
        )


@receiver(post_save, sender=Due)
def notify_new_due_created(sender, instance, created, **kwargs):
    """Notify all residents about new estate due"""
    if created:
        notify_all_residents(
            estate=instance.estate,
            title=f"New Estate Due: {instance.title}",
            message=f"Amount: ₦{instance.amount:,.2f}\nDue Date: {instance.due_date.strftime('%B %d, %Y')}\n{instance.description[:100]}",
            notification_type='due',
            action_url=f'/dues/{instance.id}',
            exclude_user=instance.created_by
        )