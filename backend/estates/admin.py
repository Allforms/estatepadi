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
admin.site.register(Notification)
admin.site.register(ActivityLog)
admin.site.register(Announcement)

@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ('name', 'interval', 'amount', 'paystack_plan_code')
    search_fields = ('name', 'paystack_plan_code')


@admin.register(EstateSubscription)
class EstateSubscriptionAdmin(admin.ModelAdmin):
    list_display = ('estate', 'plan', 'status', 'next_billing_date')
    readonly_fields = ('created_at', 'updated_at')
    list_filter  = ('status',)
    search_fields = ('estate__name', 'paystack_subscription_code')
