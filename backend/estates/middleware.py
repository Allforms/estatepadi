from django.conf import settings
from django.http import HttpResponseForbidden
import logging

logger = logging.getLogger(__name__)

class AdminIPRestrictMiddleware:
    """
    Restrict /admin access to specific IPs in production.
    Works correctly behind proxies (like Railway).
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if not settings.DEBUG and "/admin" in request.path:
            # Get real client IP, considering Railway proxy
            x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
            if x_forwarded_for:
                # Take the first IP in the comma-separated list
                ip = x_forwarded_for.split(",")[0].strip()
            else:
                ip = request.META.get("REMOTE_ADDR")

            allowed_ips = getattr(settings, "ALLOWED_ADMIN_IPS", [])

            if ip not in allowed_ips:
                logger.warning(f"❌ Unauthorized admin access attempt from IP: {ip}")
                return HttpResponseForbidden("Forbidden: Admin access denied.")
            else:
                logger.info(f"✅ Admin access granted from IP: {ip}")

        return self.get_response(request)
