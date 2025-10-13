from functools import wraps
from rest_framework.response import Response
from rest_framework import status


from functools import wraps
from rest_framework.response import Response
from rest_framework import status


def subscription_required(view_func):
    @wraps(view_func)
    def wrapped_view(request, *args, **kwargs):
        user = request.user

        # Check if user is authenticated
        if not user.is_authenticated:
            return Response({'error': 'Authentication required.'},
                          status=status.HTTP_401_UNAUTHORIZED)

        # Allow superusers to bypass subscription checks
        if user.is_superuser:
            return view_func(request, *args, **kwargs)

        # Check user role (if you still need role-based access)
        if user.role not in ['admin', 'resident']:
            return Response({'error': 'Access restricted to authorized users only.'},
                            status=status.HTTP_403_FORBIDDEN)

        # Check if user has a subscription
        if not hasattr(user, 'subscription'):
            return Response({
                'error': 'No subscription found for your account.',
                'message': 'Please subscribe to access the platform.',
                'action_required': 'setup_subscription'
            }, status=status.HTTP_402_PAYMENT_REQUIRED)

        subscription = user.subscription

        # Check if subscription is active
        if not subscription.is_active():
            # Provide specific error messages based on status
            if subscription.status == 'cancelled':
                return Response({
                    'error': 'Your subscription has been cancelled.',
                    'message': 'Please renew your subscription to continue using the service.',
                    'action_required': 'renew_subscription'
                }, status=status.HTTP_402_PAYMENT_REQUIRED)
            
            elif subscription.status == 'past_due':
                return Response({
                    'error': 'Your subscription payment is past due.',
                    'message': 'Please update your payment method to restore access.',
                    'action_required': 'update_payment'
                }, status=status.HTTP_402_PAYMENT_REQUIRED)
            
            elif subscription.is_expired():
                # Check if we're in grace period
                if subscription.grace_period_active():
                    return Response({
                        'error': 'Your subscription has expired but is in grace period.',
                        'message': 'Please renew immediately to avoid service interruption.',
                        'action_required': 'renew_subscription',
                        'grace_period': True
                    }, status=status.HTTP_402_PAYMENT_REQUIRED)
                else:
                    return Response({
                        'error': 'Your subscription has expired.',
                        'message': 'Please renew your subscription to continue using the service.',
                        'expired_date': subscription.next_billing_date.isoformat(),
                        'action_required': 'renew_subscription'
                    }, status=status.HTTP_402_PAYMENT_REQUIRED)
            
            else:
                return Response({
                    'error': f'Your subscription is {subscription.status}.',
                    'message': 'Please contact support for assistance.',
                    'action_required': 'contact_support'
                }, status=status.HTTP_402_PAYMENT_REQUIRED)

        return view_func(request, *args, **kwargs)
    return wrapped_view



# Alternative: Class-based view mixin
class SubscriptionRequiredMixin:
    """
    Mixin for class-based views that require active user subscription
    """
    def dispatch(self, request, *args, **kwargs):
        user = request.user

        # Check if user is authenticated
        if not user.is_authenticated:
            return Response({'error': 'Authentication required.'},
                          status=status.HTTP_401_UNAUTHORIZED)

        # Allow superusers to bypass subscription checks
        if user.is_superuser:
            return super().dispatch(request, *args, **kwargs)

        # Check user role
        if user.role not in ['admin', 'resident']:
            return Response({'error': 'Access restricted to authorized users only.'},
                            status=status.HTTP_403_FORBIDDEN)

        # Check if user has a subscription
        if not hasattr(user, 'subscription'):
            return Response({
                'error': 'No subscription found for your account.',
                'message': 'Please subscribe to access the platform.',
                'action_required': 'setup_subscription'
            }, status=status.HTTP_402_PAYMENT_REQUIRED)

        subscription = user.subscription

        # Check if subscription is active
        if not subscription.is_active():
            if subscription.status == 'cancelled':
                return Response({
                    'error': 'Your subscription has been cancelled.',
                    'message': 'Please renew your subscription to continue using the service.',
                    'action_required': 'renew_subscription'
                }, status=status.HTTP_402_PAYMENT_REQUIRED)
            
            elif subscription.status == 'past_due':
                return Response({
                    'error': 'Your subscription payment is past due.',
                    'message': 'Please update your payment method to restore access.',
                    'action_required': 'update_payment'
                }, status=status.HTTP_402_PAYMENT_REQUIRED)
            
            elif subscription.is_expired():
                if subscription.grace_period_active():
                    return Response({
                        'error': 'Your subscription has expired but is in grace period.',
                        'message': 'Please renew immediately to avoid service interruption.',
                        'action_required': 'renew_subscription',
                        'grace_period': True
                    }, status=status.HTTP_402_PAYMENT_REQUIRED)
                else:
                    return Response({
                        'error': 'Your subscription has expired.',
                        'message': 'Please renew your subscription to continue using the service.',
                        'expired_date': subscription.next_billing_date.isoformat(),
                        'action_required': 'renew_subscription'
                    }, status=status.HTTP_402_PAYMENT_REQUIRED)
            
            else:
                return Response({
                    'error': f'Your subscription is {subscription.status}.',
                    'message': 'Please contact support for assistance.',
                    'action_required': 'contact_support'
                }, status=status.HTTP_402_PAYMENT_REQUIRED)

        return super().dispatch(request, *args, **kwargs)


# def subscription_required(view_func):
    # @wraps(view_func)
    # def wrapped_view(request, *args, **kwargs):
    #     user = request.user

    #     # Check if user is authenticated
    #     if not user.is_authenticated:
    #         return Response({'error': 'Authentication required.'},
    #                       status=status.HTTP_401_UNAUTHORIZED)

    #     # Allow superusers to bypass subscription checks
    #     if user.is_superuser:
    #         return view_func(request, *args, **kwargs)

    #     # Check user role
    #     if user.role not in ['admin', 'resident']:
    #         return Response({'error': 'Access restricted to estate members only.'},
    #                         status=status.HTTP_403_FORBIDDEN)

    #     # Check if user has an estate
    #     estate = getattr(user, 'estate', None)
    #     if not estate:
    #         return Response({'error': 'No estate associated with your account.'},
    #                         status=status.HTTP_403_FORBIDDEN)

    #     # Check if estate has a subscription
    #     if not hasattr(estate, 'subscription'):
    #         return Response({
    #             'error': 'No subscription found for your estate.',
    #             'message': 'Please contact your admin to set up a subscription.',
    #             'action_required': 'setup_subscription'
    #         }, status=status.HTTP_402_PAYMENT_REQUIRED)

    #     subscription = estate.subscription

    #     # Check if subscription is active
    #     if not subscription.is_active():
    #         # Provide specific error messages based on status
    #         if subscription.status == 'cancelled':
    #             return Response({
    #                 'error': 'Estate subscription has been cancelled.',
    #                 'message': 'Please renew your subscription to continue using the service.',
    #                 'action_required': 'renew_subscription'
    #             }, status=status.HTTP_402_PAYMENT_REQUIRED)
            
    #         elif subscription.status == 'past_due':
    #             return Response({
    #                 'error': 'Estate subscription payment is past due.',
    #                 'message': 'Please update your payment method to restore access.',
    #                 'action_required': 'update_payment'
    #             }, status=status.HTTP_402_PAYMENT_REQUIRED)
            
    #         elif subscription.is_expired():
    #             # Check if we're in grace period
    #             if subscription.grace_period_active():
    #                 return Response({
    #                     'error': 'Estate subscription has expired but is in grace period.',
    #                     'message': 'Please renew immediately to avoid service interruption.',
    #                     'action_required': 'renew_subscription',
    #                     'grace_period': True
    #                 }, status=status.HTTP_402_PAYMENT_REQUIRED)
    #             else:
    #                 return Response({
    #                     'error': 'Estate subscription has expired.',
    #                     'message': 'Please renew your subscription to continue using the service.',
    #                     'expired_date': subscription.next_billing_date.isoformat(),
    #                     'action_required': 'renew_subscription'
    #                 }, status=status.HTTP_402_PAYMENT_REQUIRED)
            
    #         else:
    #             return Response({
    #                 'error': f'Estate subscription is {subscription.status}.',
    #                 'message': 'Please contact support for assistance.',
    #                 'action_required': 'contact_support'
    #             }, status=status.HTTP_402_PAYMENT_REQUIRED)

    #     return view_func(request, *args, **kwargs)
    # return wrapped_view

def admin_subscription_required(view_func):
    """
    Decorator specifically for admin-only endpoints that require active subscription
    """
    @wraps(view_func)
    def wrapped_view(request, *args, **kwargs):
        user = request.user

        # Check if user is authenticated
        if not user.is_authenticated:
            return Response({'error': 'Authentication required.'},
                          status=status.HTTP_401_UNAUTHORIZED)

        # Allow superusers to bypass subscription checks
        if user.is_superuser:
            return view_func(request, *args, **kwargs)

        # Check if user is admin
        if user.role != 'admin':
            return Response({'error': 'Admin access required.'},
                            status=status.HTTP_403_FORBIDDEN)

       
        estate = getattr(user, 'estate', None)
        if not estate:
            return Response({'error': 'No estate associated with your account.'},
                            status=status.HTTP_403_FORBIDDEN)

        if not hasattr(user, 'subscription'):
            return Response({
                'error': 'No subscription found for you.',
                'message': 'Please set up a subscription to access admin features.',
                'action_required': 'setup_subscription'
            }, status=status.HTTP_402_PAYMENT_REQUIRED)

        subscription = user.subscription
        if not subscription.is_active():
            return Response({
                'error': 'User subscription is not active.',
                'message': 'Please ensure your subscription is active to access admin features.',
                'status': subscription.status,
                'next_billing_date': subscription.next_billing_date.isoformat(),
                'action_required': 'renew_subscription'
            }, status=status.HTTP_402_PAYMENT_REQUIRED)

        return view_func(request, *args, **kwargs)
    return wrapped_view