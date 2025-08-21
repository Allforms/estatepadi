from rest_framework.permissions import BasePermission

class IsEstateAdmin(BasePermission):
    """
    Allows access only to Estate Admin users.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'
