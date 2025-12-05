from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import *
from django.contrib.auth.admin import UserAdmin
from django.contrib import admin
from .models import User

class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'estate', 'role', 'is_approved', 'resident_type')
    list_filter = ('role', 'is_approved', 'resident_type', 'estate')
    ordering = ('email',)
    readonly_fields = ('date_joined', 'last_login')

    fieldsets = (
        (None, {
            'fields': ('email', 'password')
        }),
        ('Personal info', {
            'fields': ('first_name', 'last_name', 'phone_number', 'home_address', 
                       'house_type', 'resident_type')
        }),
        ('Estate Info', {
            'fields': ('estate', 'role', 'is_approved')
        }),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')
        }),
        ('Important dates', {
            'fields': ('last_login', 'date_joined')
        }),
    )



class EstateBankAccountInline(admin.TabularInline):
    model = EstateBankAccount
    extra = 1  # Allows adding multiple in admin
class EstateLeadersInline(admin.TabularInline):
    model = EstateLeadership
    extra = 1

@admin.register(Estate)
class EstateAdmin(admin.ModelAdmin):
    list_display = ('name', 'address')
    inlines = [EstateBankAccountInline, EstateLeadersInline]


admin.site.register(User, CustomUserAdmin)
admin.site.register(EstateLeadership)
admin.site.register(VisitorCode)
admin.site.register(Due)
admin.site.register(DuePayment)
admin.site.register(ActivityLog)
admin.site.register(Announcement)
admin.site.register(UserSubscriptionHistory)
admin.site.register(ArtisanOrDomesticStaff)
admin.site.register(Alert)
admin.site.register(Notification)
admin.site.register(PushSubscription)


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'user', 'action', 'model_name', 'object_id', 'ip_address')
    list_filter = ('action', 'model_name', 'timestamp')
    search_fields = ('user__email', 'model_name', 'object_id', 'ip_address')
    readonly_fields = ('user', 'action', 'model_name', 'object_id', 'changes', 'timestamp', 'ip_address')
    date_hierarchy = 'timestamp'
    ordering = ('-timestamp',)

    def has_add_permission(self, request):
        # Prevent manual creation of audit logs
        return False

    def has_change_permission(self, request, obj=None):
        # Make audit logs read-only
        return False

    def has_delete_permission(self, request, obj=None):
        # Prevent deletion of audit logs
        return False

@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ('name', 'interval', 'amount', 'paystack_plan_code')
    search_fields = ('name', 'paystack_plan_code')


@admin.register(UserSubscription)
class EstateSubscriptionAdmin(admin.ModelAdmin):
    list_display = ('user', 'plan', 'status', 'next_billing_date')
    readonly_fields = ('created_at', 'updated_at')
    list_filter  = ('status',)
    search_fields = ('user__name', 'paystack_subscription_code')
