# core/views/notification_views.py
# Create this new file for notification API endpoints

from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.conf import settings
from django.db.models import Q
from .models import PushSubscription, Notification
from .serializers import PushSubscriptionSerializer, NotificationSerializer


# ============= PAGINATION =============

class NotificationPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


# ============= PUSH NOTIFICATION ENDPOINTS =============

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_vapid_public_key(request):
    """
    Get VAPID public key for web push subscription
    """
    return Response({
        'public_key': settings.WEBPUSH_SETTINGS.get('VAPID_PUBLIC_KEY', '')
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def subscribe_push(request):
    """
    Subscribe user to push notifications
    
    Expected payload:
    {
        "subscription": {
            "endpoint": "https://...",
            "keys": {
                "auth": "...",
                "p256dh": "..."
            }
        },
        "device_type": "web"  // optional, defaults to "web"
    }
    """
    try:
        subscription_data = request.data.get('subscription', {})
        device_type = request.data.get('device_type', 'web')
        
        endpoint = subscription_data.get('endpoint')
        keys = subscription_data.get('keys', {})
        
        if not endpoint or not keys:
            return Response(
                {'error': 'Invalid subscription data. Endpoint and keys are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create or update subscription
        subscription, created = PushSubscription.objects.update_or_create(
            user=request.user,
            endpoint=endpoint,
            defaults={
                'auth': keys.get('auth', ''),
                'p256dh': keys.get('p256dh', ''),
                'device_type': device_type,
                'is_active': True
            }
        )
        
        return Response({
            'status': 'subscribed',
            'message': 'Successfully subscribed to push notifications',
            'subscription_id': subscription.id
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to subscribe: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def unsubscribe_push(request):
    """
    Unsubscribe user from push notifications
    
    Expected payload:
    {
        "endpoint": "https://..."  // optional, if not provided, all subscriptions will be deactivated
    }
    """
    try:
        endpoint = request.data.get('endpoint')
        
        if endpoint:
            # Deactivate specific subscription
            count = PushSubscription.objects.filter(
                user=request.user,
                endpoint=endpoint
            ).update(is_active=False)
        else:
            # Deactivate all subscriptions for user
            count = PushSubscription.objects.filter(
                user=request.user
            ).update(is_active=False)
        
        return Response({
            'status': 'unsubscribed',
            'message': f'Successfully unsubscribed from push notifications ({count} subscription(s) deactivated)'
        })
        
    except Exception as e:
        return Response(
            {'error': f'Failed to unsubscribe: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def test_notification(request):
    """
    Test endpoint to send a test notification (for development/testing)
    """
    from utils.push_notification import send_push_notification
    
    result = send_push_notification(
        user=request.user,
        title="Test Notification 🔔",
        message="This is a test notification from EstatePadi! If you can see this, push notifications are working correctly.",
        notification_type='general',
        action_url='/'
    )
    
    return Response(result)


# ============= NOTIFICATION VIEWSET =============

class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for viewing and managing notifications
    
    list: Get all notifications for current user
    retrieve: Get a specific notification
    mark_read: Mark a notification as read (POST)
    mark_all_read: Mark all notifications as read (POST)
    unread_count: Get count of unread notifications (GET)
    by_type: Filter notifications by type (GET)
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = NotificationPagination
    
    def get_queryset(self):
        """
        Get notifications for the current user, ordered by newest first
        """
        queryset = Notification.objects.filter(recipient=self.request.user)
        
        # Optional filtering by read status
        is_read = self.request.query_params.get('is_read')
        if is_read is not None:
            is_read_bool = is_read.lower() in ['true', '1', 'yes']
            queryset = queryset.filter(is_read=is_read_bool)
        
        # Optional filtering by notification type
        notification_type = self.request.query_params.get('type')
        if notification_type:
            queryset = queryset.filter(notification_type=notification_type)
        
        return queryset.order_by('-created_at')
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """
        Mark a specific notification as read
        
        POST /api/notifications/{id}/mark_read/
        """
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        
        return Response({
            'status': 'success',
            'message': 'Notification marked as read',
            'notification_id': notification.id
        })
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """
        Mark all notifications as read for current user
        
        POST /api/notifications/mark_all_read/
        """
        count = self.get_queryset().filter(is_read=False).update(is_read=True)
        
        return Response({
            'status': 'success',
            'message': f'{count} notification(s) marked as read',
            'count': count
        })
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """
        Get count of unread notifications
        
        GET /api/notifications/unread_count/
        """
        count = self.get_queryset().filter(is_read=False).count()
        
        return Response({
            'unread_count': count
        })
    
    @action(detail=False, methods=['get'])
    def by_type(self, request):
        """
        Get notifications filtered by type
        
        GET /api/notifications/by_type/?type=alert
        """
        notification_type = request.query_params.get('type')
        
        if not notification_type:
            return Response(
                {'error': 'type parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        queryset = self.get_queryset().filter(notification_type=notification_type)
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['delete'])
    def clear_all(self, request):
        """
        Delete all read notifications for current user
        
        DELETE /api/notifications/clear_all/
        """
        count = self.get_queryset().filter(is_read=True).delete()[0]
        
        return Response({
            'status': 'success',
            'message': f'{count} read notification(s) deleted',
            'count': count
        })
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """
        Get notification statistics for current user
        
        GET /api/notifications/statistics/
        """
        queryset = self.get_queryset()
        
        # Count by type
        type_counts = {}
        for choice in Notification.NOTIFICATION_TYPES:
            type_key = choice[0]
            count = queryset.filter(notification_type=type_key).count()
            if count > 0:
                type_counts[type_key] = count
        
        return Response({
            'total': queryset.count(),
            'unread': queryset.filter(is_read=False).count(),
            'read': queryset.filter(is_read=True).count(),
            'by_type': type_counts,
            'push_sent': queryset.filter(is_push_sent=True).count()
        })


# ============= SUBSCRIPTION MANAGEMENT =============

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_subscriptions(request):
    """
    Get all push subscriptions for current user
    
    GET /api/push/subscriptions/
    """
    subscriptions = PushSubscription.objects.filter(user=request.user)
    serializer = PushSubscriptionSerializer(subscriptions, many=True)
    
    return Response({
        'subscriptions': serializer.data,
        'total': subscriptions.count(),
        'active': subscriptions.filter(is_active=True).count()
    })


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_subscription(request, subscription_id):
    """
    Delete a specific push subscription
    
    DELETE /api/push/subscriptions/{id}/
    """
    try:
        subscription = PushSubscription.objects.get(
            id=subscription_id,
            user=request.user
        )
        subscription.delete()
        
        return Response({
            'status': 'success',
            'message': 'Subscription deleted successfully'
        })
    except PushSubscription.DoesNotExist:
        return Response(
            {'error': 'Subscription not found'},
            status=status.HTTP_404_NOT_FOUND
        )