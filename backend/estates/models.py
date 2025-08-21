from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from datetime import timedelta
import random
import string
from django.utils.translation import gettext_lazy as _
from django.contrib.auth.base_user import BaseUserManager
from django.conf import settings
from .bunny_storage import BunnyStorage

class Estate(models.Model):
    name = models.CharField(max_length=255)
    address = models.TextField()
    description = models.TextField(blank=True, null=True)
    phone_number = models.CharField(max_length=20)
    email = models.EmailField()
    logo = models.ImageField(upload_to='estate_logos/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
class EstateBankAccount(models.Model):
    estate = models.ForeignKey(Estate, on_delete=models.CASCADE, related_name='bank_accounts')
    account_number = models.CharField(max_length=50)
    account_name = models.CharField(max_length=255)
    bank_name = models.CharField(max_length=100)

    class Meta:
        unique_together = ('estate', 'account_number')  

    def __str__(self):
        return f"{self.bank_name} - {self.account_number} ({self.estate.name})"

class CustomUserManager(BaseUserManager):
    
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field is required')
        
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        return self.create_user(email, password, **extra_fields)
 
class User(AbstractUser):
    username = None  # ❌ Remove username
    email = models.EmailField(_('email address'), unique=True)  # ✅ Make email unique

    ROLE_CHOICES = [
        ('admin', 'Estate Admin'),
        ('resident', 'Resident'),
        ('security', 'Estate Security'),
    ]

    RESIDENT_TYPE_CHOICES = [
        ('tenant', 'Tenant'),
        ('landlord/landlady', 'Landlord/Landlady'),
        ('security', 'Security'),
        
    ]
    HOUSE_TYPE_CHOICES = [
        ('self_contained', 'Self Contained'),
        ('miniflat', 'Miniflat'),
        ('2bedroom', '2 Bedroom'),
        ('3bedroom', '3 Bedroom'),
        ('4bedroom', '4 Bedroom'),
        ('duplex', 'Duplex'),
        ('bungalow', 'Bungalow'),
        ('mansion', 'Mansion'),
        ('townhouse', 'Townhouse'),
        ('other', 'Other'),
    ]

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='resident')
    estate = models.ForeignKey(Estate, on_delete=models.CASCADE, null=True, blank=True)
    phone_number = models.CharField(max_length=20, unique=True)
    home_address = models.TextField(blank=True)
    house_type = models.CharField(max_length=20, choices=HOUSE_TYPE_CHOICES, blank=True)
    resident_type = models.CharField(max_length=20, choices=RESIDENT_TYPE_CHOICES, blank=True, null=True)
    is_approved = models.BooleanField(default=False)
    is_email_verified = models.BooleanField(default=False)  
    verification_code = models.CharField(max_length=6, blank=True, null=True)  
    date_joined = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(auto_now=True)
    password_reset_code = models.CharField(max_length=128, null=True, blank=True)
    password_reset_code_created_at = models.DateTimeField(null=True, blank=True)

    USERNAME_FIELD = 'email' 
    REQUIRED_FIELDS = [] 
    objects = CustomUserManager()       

    def __str__(self):
        return f"{self.email} - {self.estate.name if self.estate else 'No Estate'}"



 
class EstateLeadership(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    estate = models.ForeignKey(Estate, on_delete=models.CASCADE, related_name='leadership')
    position = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=20)
    email = models.EmailField()
    profile_picture = models.ImageField(upload_to='leadership_pictures/', blank=True, null=True)
    bio = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', 'position']
    

    def __str__(self):
        return f"{self.user.email} - {self.position} at {self.estate.name}"
    

class VisitorCode(models.Model):
    resident = models.ForeignKey(User, on_delete=models.CASCADE, related_name='visitor_codes')
    visitor_name = models.CharField(max_length=255)
    code = models.CharField(max_length=10, unique=True)
    purpose = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    used_at = models.DateTimeField(blank=True, null=True)

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = self.generate_code()
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(minutes=30)
        super().save(*args, **kwargs)

    def generate_code(self):
        while True:
            code = ''.join(random.choices(string.digits, k=6))
            if not VisitorCode.objects.filter(code=code).exists():
                return code
    
    def is_valid(self):
        return not self.is_used and timezone.now() < self.expires_at
    
    def __str__(self):
        return f"Visitor Code {self.code} for {self.visitor_name} by {self.resident.email}"

class Due(models.Model):
    estate = models.ForeignKey(Estate, on_delete=models.CASCADE, related_name='estate_dues')
    title = models.CharField(max_length=255)
    description = models.TextField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    due_date = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='dues_created')


    def __str__(self):
        return f"{self.title} - {self.estate.name}"
    

class DuePayment(models.Model):
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    due = models.ForeignKey(Due, on_delete=models.CASCADE)
    resident = models.ForeignKey(User, on_delete=models.CASCADE)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2)
    payment_evidence = models.ImageField(upload_to='payment_evidence/')
    payment_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    admin_notes = models.TextField(blank=True)
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_payments')
    approved_at = models.DateTimeField(null=True, blank=True)

    # class Meta:
    #     unique_together = ('due', 'resident')

    def __str__(self):
        return f"Payment for {self.due.title} by {self.resident.email} - {self.status}"
    
class Notification(models.Model):
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification for {self.recipient.email} - {'Read' if self.is_read else 'Unread'}"
    

class AuditLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    action = models.CharField(max_length=100)
    model_name = models.CharField(max_length=50)
    object_id = models.PositiveIntegerField()
    changes = models.JSONField(default=dict)
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField()




class ActivityLog(models.Model):
    
    class ActivityType(models.TextChoices):
        NEW_RESIDENT = 'new_resident', _('New Resident')
        PAYMENT = 'payment', _('Payment Evidence')
        VISITOR_CODE = 'visitor_code', _('Visitor Code')

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    estate = models.ForeignKey('Estate', on_delete=models.CASCADE)
    type = models.CharField(max_length=50, choices=ActivityType.choices)
    description = models.TextField()
    related_id = models.PositiveIntegerField(null=True, blank=True, help_text="ID of related object (e.g., Resident, Payment, VisitorCode)")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.get_type_display()} - {self.description} ({self.created_at.date()})"


#subscription models
class SubscriptionPlan(models.Model):
    """
    Model to represent subscription plans for estates. A pricing tier which
    i will create in the Paystack dashboard first,
    then mirror each plan code here.
    """
    paystack_plan_code = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=100)
    amount = models.PositiveIntegerField(help_text="Amount in kobo (e.g. ₦10,000 → 1000000)")
    interval = models.CharField( max_length=10, choices=[('monthly','Monthly')], default='monthly')
    description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.name} ({self.interval}) – {self.amount/100:.2f}"
    

class EstateSubscription(models.Model):
    """
    Links an Estate to its Paystack subscription status.
    """
    ESTATE_STATUS = [
        ('active', 'Active'),
        ('paused', 'Paused'),
        ('cancelled', 'Cancelled'),
        ('past_due', 'Past Due'), 
    ]

    estate = models.OneToOneField(
        'Estate', on_delete=models.CASCADE, related_name='subscription')
    paystack_customer_code = models.CharField(max_length=100)
    paystack_subscription_code = models.CharField(max_length=100)
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.PROTECT)
    status = models.CharField(max_length=20, choices=ESTATE_STATUS, default='active')
    next_billing_date = models.DateTimeField()
    authorization_code = models.CharField(max_length=150, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.estate.name}: {self.plan.name} [{self.status}]"

    def is_active(self):
        """
        Check if subscription is active and hasn't expired
        """
        # Must have active status
        if self.status != 'active':
            return False
        
        # Must not be past the next billing date (with some grace period)
        # Adding 1 day grace period in case of processing delays
        grace_period = timezone.timedelta(days=1)
        return timezone.now() < (self.next_billing_date + grace_period)

    def is_expired(self):
        """
        Check if subscription has expired
        """
        return timezone.now() > self.next_billing_date

    def days_until_expiry(self):
        """
        Calculate days until subscription expires
        """
        if self.is_expired():
            return 0
        
        delta = self.next_billing_date - timezone.now()
        return delta.days

    def grace_period_active(self):
        """
        Check if we're in the grace period (expired but within 1 day)
        """
        if not self.is_expired():
            return False
        
        grace_period = timezone.timedelta(days=1)
        return timezone.now() < (self.next_billing_date + grace_period)

    

class Announcement(models.Model):
    title = models.CharField(max_length=200)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    estate = models.ForeignKey('Estate', on_delete=models.CASCADE, related_name='announcements')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title
