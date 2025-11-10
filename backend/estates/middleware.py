from django.conf import settings
from django.http import HttpResponseForbidden

class AdminIPRestrictMiddleware:
    """
    Restrict /admin access to specific IPs in production.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Only enforce restriction if DEBUG=False (production)
        if not settings.DEBUG and request.path.startswith("/admin"):
            # Handle Railway or proxy setups
            ip = (
                request.META.get("HTTP_X_FORWARDED_FOR", "").split(",")[0].strip()
                or request.META.get("REMOTE_ADDR")
            )
            allowed_ips = getattr(settings, "ALLOWED_ADMIN_IPS", [])

            if ip not in allowed_ips:
                return HttpResponseForbidden("Forbidden: Admin access denied.")
        return self.get_response(request)
