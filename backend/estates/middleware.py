from django.conf import settings
from django.http import HttpResponseForbidden
import logging

logger = logging.getLogger(__name__)

class AdminIPRestrictMiddleware:
    """
    Restrict Django admin panel (/admin/) access to specific IPs in production.
    Works correctly behind proxies (like Railway).

    IMPORTANT: Only restricts the Django admin panel at /admin/, NOT API endpoints like /api/admin/*
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Only restrict Django admin panel, not API endpoints
        # Check if path starts with /admin/ (Django admin panel) but NOT /api/admin (API endpoints)
        is_django_admin = request.path.startswith("/admin/") or request.path == "/admin"
        is_api_endpoint = request.path.startswith("/api/")

        if not settings.DEBUG and is_django_admin and not is_api_endpoint:
            # Get real client IP, considering Railway proxy
            x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
            if x_forwarded_for:
                # Take the first IP in the comma-separated list
                ip = x_forwarded_for.split(",")[0].strip()
            else:
                ip = request.META.get("REMOTE_ADDR")

            allowed_ips = getattr(settings, "ALLOWED_ADMIN_IPS", [])

            if ip not in allowed_ips:
                logger.warning(f"❌ Unauthorized Django admin panel access attempt from IP: {ip} for path: {request.path}")
                return HttpResponseForbidden("Forbidden: Django admin panel access denied.")
            else:
                logger.info(f"✅ Django admin panel access granted from IP: {ip} for path: {request.path}")

        return self.get_response(request)
