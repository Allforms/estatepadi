from rest_framework import serializers
from .models import *
import random
from postmarker.core import PostmarkClient
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from django.template.loader import render_to_string

class ProfileSerializer(serializers.ModelSerializer):
    estate = serializers.PrimaryKeyRelatedField(read_only=True)
    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'first_name',
            'last_name',
            'phone_number',
            'home_address',
            'street_number',
            'resident_type',
            'estate',
            'date_joined',
        ]
        read_only_fields = ['id', 'email', 'date_joined']



class EstateBankAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = EstateBankAccount
        fields = ['id', 'account_number', 'account_name', 'bank_name']

class EstateLeadershipSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.none(), required=True)
    email = serializers.SerializerMethodField(read_only=True)  # Only for display purposes

    class Meta:
        model = EstateLeadership
        fields = ['id', 'user', 'email', 'position', 'phone_number', 'bio', 'order', 'profile_picture', 'estate']
        extra_kwargs = {
            'estate': {'required': False},
        }

    def __init__(self, *args, **kwargs):
        super(EstateLeadershipSerializer, self).__init__(*args, **kwargs)
        
        request = self.context.get('request')
        estate_id = None

        if request and 'estate_id' in request.parser_context.get('kwargs', {}):
            estate_id = request.parser_context['kwargs']['estate_id']

        if estate_id:
            self.fields['user'].queryset = User.objects.filter(estate_id=estate_id, is_approved=True)

    def get_email(self, obj):
        return obj.user.email if obj.user else None

class EstateSerializer(serializers.ModelSerializer):
    bank_accounts = EstateBankAccountSerializer(many=True, required=False)
    def update(self, instance, validated_data):
        bank_accounts_data = validated_data.pop('bank_accounts', None)
        
        # Update estate fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Handle bank accounts if provided
        if bank_accounts_data is not None:
            # Clear existing accounts and create new ones
            instance.bank_accounts.all().delete()
            for account_data in bank_accounts_data:
                EstateBankAccount.objects.create(estate=instance, **account_data)
        
        return instance
    estate_leaders = EstateLeadershipSerializer(many=True, read_only=True)
    class Meta:
        model = Estate
        fields = '__all__'

    
class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email', 'password', 'first_name', 
                  'last_name', 'phone_number', 'home_address', 'house_type', 
                  'resident_type', 'estate']

    def validate(self, attrs):
        
        if User.objects.filter(phone_number=attrs['phone_number']).exists():
            raise serializers.ValidationError({"phone_number": "Phone number already in use."})
        
        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password')
        # Set role based on resident_type
        resident_type = validated_data.get('resident_type')
        if resident_type == 'security':
            validated_data['role'] = 'security'
        else:
            validated_data['role'] = 'resident'

        # Generate verification code
        verification_code = str(random.randint(100000, 999999))
        validated_data['verification_code'] = verification_code
        validated_data['is_active'] = False  # user is inactive until email is verified

        user = User(**validated_data)
        user.set_password(password)
        user.save()

        # Send email using Postmarker
        client = PostmarkClient(server_token=settings.POSTMARK_TOKEN)
        client.emails.send(
            From=settings.POSTMARK_SENDER,
            To=user.email,
            Subject='Verify Your Estate Account',
            HtmlBody=render_to_string("estates/verify-email.html", {
                "first_name": user.first_name,
                "verification_code": verification_code,
                "current_year": timezone.now().year,
            }),

            TextBody=f"Hello {user.first_name},\nYour verification code is: {verification_code}",
            MessageStream='outbound'  
        )
        return user

class VerifyEmailSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6)

    def validate(self, attrs):
        try:
            user = User.objects.get(email=attrs['email'], verification_code=attrs['code'])
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid verification code.")
        attrs['user'] = user
        return attrs


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("No user with that email.")
        return value


class PasswordResetConfirmSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField()
    new_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get("email")
        code = attrs.get("code")

        user = User.objects.filter(email=email, password_reset_code=code).first()
        if not user:
            raise serializers.ValidationError("Invalid code or email.")

        if user.password_reset_code_created_at and timezone.now() - user.password_reset_code_created_at > timedelta(minutes=10):
            raise serializers.ValidationError("Reset code expired.")

        attrs["user"] = user
        return attrs

    def save(self):
        user = self.validated_data["user"]
        user.set_password(self.validated_data["new_password"])
        user.password_reset_code = None
        user.password_reset_code_created_at = None
        user.save()



class UserSerializer(serializers.ModelSerializer):
    estate_name = serializers.CharField(source='estate.name', read_only=True)
    subscription_active = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 
            'phone_number', 'home_address', 'house_type', 
            'resident_type', 'estate', 'estate_name', 'is_approved', 
            'role', 'date_joined', 'subscription_active'
        ]
        read_only_fields = ['is_approved', 'role']

    def get_subscription_active(self, obj):
        subscription = getattr(obj, 'subscription', None)
        if not subscription:
            return False
        return subscription.is_active()



class VisitorCodeSerializer(serializers.ModelSerializer):
    resident = serializers.SerializerMethodField()
    
    class Meta:
        model = VisitorCode
        fields = ['id', 'resident', 'visitor_name', 'code', 'purpose', 
                 'created_at', 'expires_at', 'is_used', 'used_at']
        read_only_fields = ['code', 'created_at', 'expires_at', 'is_used', 'used_at']
    
    def get_resident(self, obj):
        return {
            'id': obj.resident.id,
            'home_address': getattr(obj.resident, 'home_address', 'N/A'),
        }

class DueSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.email', read_only=True)
    latest_payment_status = serializers.SerializerMethodField()
    latest_payment_date = serializers.SerializerMethodField()
    latest_amount_paid = serializers.SerializerMethodField()

    class Meta:
        model = Due
        fields = [
            'id', 'title', 'description', 'amount', 'due_date',
            'created_at', 'created_by_name',
            'latest_payment_status', 'latest_payment_date', 'latest_amount_paid'
        ]

    def get_latest_payment_status(self, obj):
        request = self.context.get('request')
        if not request:
            return None
        
        user = request.user
        latest_payment = DuePayment.objects.filter(due=obj, resident=user).order_by('-payment_date').first()
        return latest_payment.status if latest_payment else None

    def get_latest_payment_date(self, obj):
        request = self.context.get('request')
        if not request:
            return None
        
        user = request.user
        latest_payment = DuePayment.objects.filter(due=obj, resident=user).order_by('-payment_date').first()
        return latest_payment.payment_date if latest_payment else None

    def get_latest_amount_paid(self, obj):
        request = self.context.get('request')
        if not request:
            return None
        
        user = request.user
        latest_payment = DuePayment.objects.filter(due=obj, resident=user).order_by('-payment_date').first()
        return latest_payment.amount_paid if latest_payment else None

class DuePaymentSerializer(serializers.ModelSerializer):
    due_title = serializers.CharField(source='due.title', read_only=True)
    resident_name = serializers.CharField(source='resident.get_full_name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)
    
    class Meta:
        model = DuePayment
        fields = ['id', 'due', 'due_title', 'resident_name', 'amount_paid', 
                 'payment_evidence', 'payment_date', 'status', 'admin_notes', 
                 'approved_by_name', 'approved_at']
        read_only_fields = ['status', 'approved_by', 'approved_at']

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ['created_at']



class ActivityLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActivityLog
        fields = ['id', 'type', 'description', 'created_at']



class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = ['id', 'name', 'amount', 'interval', 'description', 'paystack_plan_code']

class AnnouncementSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = Announcement
        fields = [
            'id',
            'title',
            'message',
            'created_at',
            'estate',
            'created_by',
            'created_by_name',
        ]
        read_only_fields = ['id', 'created_at', 'created_by', 'created_by_name', 'estate']


class ContactSupportSerializer(serializers.Serializer):
    subject = serializers.CharField(max_length=255)
    message = serializers.CharField()
    email = serializers.EmailField(required=False)  # optional, if user is authenticated we can use request.user.email

class ArtisanOrDomesticStaffSerializer(serializers.ModelSerializer):
    resident_name = serializers.CharField(source="resident.email", read_only=True)
    estate_name = serializers.CharField(source="estate.name", read_only=True)

    class Meta:
        model = ArtisanOrDomesticStaff
        fields = [
            "id", "name", "role", "phone_number", "gender",
            "unique_id", "date_of_registration", "status", "removal_reason",
            "resident", "resident_name", "estate", "estate_name",
        ]
        read_only_fields = ["unique_id", "date_of_registration", "resident", "estate"]

    def validate(self, attrs):
        """
        Ensure phone_number is unique per estate.
        """
        estate = attrs.get("estate") or getattr(self.instance, "estate", None)
        phone_number = attrs.get("phone_number") or getattr(self.instance, "phone_number", None)

        if estate and phone_number:
            qs = ArtisanOrDomesticStaff.objects.filter(
                estate=estate,
                phone_number=phone_number
            )
            if self.instance:  # exclude self when updating
                qs = qs.exclude(pk=self.instance.pk)

            if qs.exists():
                raise serializers.ValidationError({
                    "phone_number": "This phone number is already registered in this estate."
                })

        return attrs

class AlertSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source="sender.email", read_only=True)
    estate_name = serializers.CharField(source="estate.name", read_only=True)

    class Meta:
        model = Alert
        fields = [
            "id", "sender", "sender_name",
            "estate", "estate_name",
            "alert_type", "other_reason", "created_at"
        ]
        read_only_fields = ["id", "created_at", "sender", "estate"]
