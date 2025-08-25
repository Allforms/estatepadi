from django.urls import path
from . import views
from .subscriptions import *
from .webhooks import paystack_webhook

urlpatterns = [
    # Authentication
    path('auth/login/', views.login_view, name='login'),
    path('auth/logout/', views.logout_view, name='logout'),
    path('auth/register/', views.register_view, name='register'),
    path('auth/verify-email/', views.VerifyEmailView.as_view(), name='verify-email'),
    path("auth/request-password-reset/", views.PasswordResetRequestView.as_view()),
    path("auth/reset-password-confirm/", views.PasswordResetConfirmView.as_view()),
    path('auth/resend-verification/', views.ResendVerificationView.as_view(), name='resend-verification'),

    #resident profile
    path('resident/profile/', views.resident_profile, name='resident-profile'),
    
    
    # Estates
    path('estates/', views.EstateListView.as_view(), name='estate-list'),
    path('estates/<int:pk>/', views.EstateDetailView.as_view(), name='estate-detail'),
    path('estates/<int:estate_id>/leadership/', views.EstateLeadershipListView.as_view(), name='estate-leadership'),
    path('estates/<int:estate_id>/leadership/<int:pk>/', views.EstateLeadershipDetailView.as_view(), name='estate-leadership-detail'),
    
    
    # Admin
    path('admin/residents/', views.residents_list_view, name='residents-list'),
    path('admin/pending-residents/', views.pending_residents_view, name='pending-residents'),
    path('admin/approve-resident/<int:user_id>/', views.approve_resident_view, name='approve-resident'),
    path('admin/delete-resident/<int:user_id>/', views.delete_resident_view, name='delete-resident'),
    path('admin/residents/pdf/', views.generate_residents_pdf, name='residents-pdf'),
    path('admin/approve-payment/<int:payment_id>/', views.approve_payment_view, name='approve-payment'),
    path('admin/reject-payment/<int:payment_id>/', views.reject_payment_view, name='reject-payment'),
    path('admin/pending-payments/', views.pending_payments_view, name='pending-payments'),
    
    # Visitor Codes
    path('visitor-codes/', views.VisitorCodeListCreateView.as_view(), name='visitor-codes'),
    path('visitor-codes/verify/', views.verify_visitor_code, name='verify-code'),
    
    # Dues and Payments
    path('dues/', views.DueListCreateView.as_view(), name='dues'),
    path('dues/<int:pk>/', views.DueRetrieveUpdateDestroyView.as_view(), name='due-detail'),
    path('payments/', views.DuePaymentListCreateView.as_view(), name='payments'),
    
    # Dashboard
    path('dashboard/', views.dashboard_view, name='dashboard'),
    
    # Notifications
    path('notifications/', views.NotificationListView.as_view(), name='notifications'),
    path('notifications/<int:notification_id>/read/', views.mark_notification_read, name='mark-notification-read'),

    # paymnts report view
    path('payments/report/pdf/', views.payment_records_pdf_view, name='payment-report'),

    #get csrf token
    path('csrf-cookie/', views.get_csrf_token),

    # Activity Log
    path('activity-log/', views.ActivityLogListView.as_view(), name='activity-log'),

    # Subscription Plans
    path('subscription/create/', create_subscription, name='create-subscription'),
    path('subscription/plans/', subscription_plans, name='subscription-plans'),
    path('subscription/status/', subscription_status, name='subscription-status'),

    # Paystack Webhooks
    path('paystack/webhook/', paystack_webhook, name='paystack-webhook'),

    # announcements
    path('announcements/', views.AnnouncementListCreateView.as_view(), name='announcement-list-create'),
    path('announcements/<int:pk>/', views.AnnouncementRetrieveUpdateDestroyView.as_view(), name='announcement-detail'),

   #paystack subscription sync
    path("paystack/sync-subscriptions/", views.sync_subscriptions_view, name="sync_subscriptions"),
    
    
]