from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .subscriptions import *
from .webhooks import paystack_webhook
from .notification_views import (
    NotificationViewSet,
    get_vapid_public_key,
    subscribe_push,
    unsubscribe_push,
    test_notification,
    get_user_subscriptions,
    delete_subscription
)
router = DefaultRouter()
router.register(r'notifications', NotificationViewSet, basename='notification')
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
    

    # paymnts report view
    path('payments/report/pdf/', views.payment_records_pdf_view, name='payment-report'),

    #get csrf token
    path('csrf-cookie/', views.get_csrf_token),

    # Activity Log
    path('activity-log/', views.ActivityLogListView.as_view(), name='activity-log'),

    # Subscription Plans
    path('subscription/cancel/', cancel_subscription, name='cancel-subscription'),
    path('subscription/create/', create_subscription, name='create-subscription'),
    path('subscription/plans/', subscription_plans, name='subscription-plans'),
    path('subscription/status/', subscription_status, name='subscription-status'),
    path('subscription/renew/', renew_subscription, name='renew-subscription'),

    # Paystack Webhooks
    path('paystack/webhook/', paystack_webhook, name='paystack-webhook'),

    # announcements
    path('announcements/', views.AnnouncementListCreateView.as_view(), name='announcement-list-create'),
    path('announcements/<int:pk>/', views.AnnouncementRetrieveUpdateDestroyView.as_view(), name='announcement-detail'),

   #paystack subscription sync
    path("paystack/sync-subscriptions/", views.sync_subscriptions_view, name="sync_subscriptions"),

    #contact support views
    path("contact-support/", views.ContactSupportView.as_view(), name="contact-support"),

    # Receipt endpoints
    path('payments/<int:payment_id>/receipt/download/', 
         views.download_receipt_view, 
         name='download-receipt'),
    
    path('payments/<int:payment_id>/receipt/view/', 
         views.view_receipt_view, 
         name='view-receipt'),
    
    path('payments/<int:payment_id>/receipt/info/', 
         views.payment_receipt_info, 
         name='receipt-info'),

     # Artisan and Domestic Staff
    path("artisans-domestics/", views.ArtisanOrDomesticStaffListCreateView.as_view(), name="artisan_domestic_list_create"),
    path("artisans-domestics/<int:pk>/", views.ArtisanOrDomesticStaffDetailView.as_view(), name="artisan_domestic_detail"),
    path("artisans-domestics/<int:pk>/disable/", views.DisableArtisanOrDomesticStaffView.as_view(), name="artisan_domestic_disable"),

    # Alerts 
    path("alert/", views.AlertListCreateView.as_view(), name="alerts"),

    # ==================== PUSH NOTIFICATION ENDPOINTS ====================
    path('push/vapid-key/', get_vapid_public_key, name='vapid-key'),
    path('push/subscribe/', subscribe_push, name='push-subscribe'),
    path('push/unsubscribe/', unsubscribe_push, name='push-unsubscribe'),
    path('push/test/', test_notification, name='test-notification'),
    path('push/subscriptions/', get_user_subscriptions, name='user-subscriptions'),
    path('push/subscriptions/<int:subscription_id>/', delete_subscription, name='delete-subscription'),

    path('', include(router.urls)),

    
    
]