# middleware/.py - admin IP whitelist middleware

import ipaddress
from django.conf import settings
from django.http import HttpResponseForbidden
from django.urls import resolve
from django.utils.deprecation import MiddlewareMixin

class AdminIPWhitelistMiddleware(MiddlewareMixin):
    def process_request(self, request):
        # Skip IP checking if DEBUG is True (development mode)
        if getattr(settings, 'DEBUG', False):
            return None
            
        # Get the resolved URL pattern
        try:
            resolved = resolve(request.path_info)
            # Check if this is an admin URL
            if resolved.app_name == 'admin':
                return self.check_admin_ip(request)
        except:
            pass
        return None
    
    def check_admin_ip(self, request):
        # Get client IP
        client_ip = self.get_client_ip(request)
        
        # Get whitelisted IPs from settings
        allowed_ips = getattr(settings, 'ADMIN_ALLOWED_IPS', [])
        
        # Filter out empty strings and None values
        allowed_ips = [ip.strip() for ip in allowed_ips if ip and ip.strip()]
        
        if not allowed_ips:
            # If no valid IPs configured in production, allow all (fail open)
            # But log a warning
            import logging
            logger = logging.getLogger('admin_security')
            logger.warning("No admin IP whitelist configured in production - allowing all IPs")
            return None
            
        # Check if IP is in whitelist
        if self.is_ip_allowed(client_ip, allowed_ips):
            return None
        
        # IP not allowed, return 403
        return HttpResponseForbidden(
            "Access denied. Your IP address is not authorized to access the admin panel."
        )
    
    def get_client_ip(self, request):
        """Get the real client IP, accounting for proxies"""
        # Railway and most cloud providers use X-Forwarded-For
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            # Take the first IP (client IP)
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        
        return ip
    
    def is_ip_allowed(self, client_ip, allowed_ips):
        """Check if client IP is in the allowed list (supports CIDR notation)"""
        try:
            client_addr = ipaddress.ip_address(client_ip)
            
            for allowed_ip in allowed_ips:
                try:
                    # Handle both single IPs and CIDR ranges
                    if '/' in allowed_ip:
                        # CIDR notation
                        if client_addr in ipaddress.ip_network(allowed_ip, strict=False):
                            return True
                    else:
                        # Single IP
                        if client_addr == ipaddress.ip_address(allowed_ip):
                            return True
                except ValueError:
                    # Invalid IP format, skip
                    continue
                    
        except ValueError:
            # Invalid client IP
            return False
            
        return False