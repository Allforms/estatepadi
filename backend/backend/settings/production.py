"""
Django production settings - CSRF Fixed Version
"""

from .base import *
import dj_database_url
import os

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config('SECRET_KEY')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = config('DEBUG', default=False, cast=bool)

# Production allowed hosts
ALLOWED_HOSTS_RAW = config('ALLOWED_HOSTS', default='*.railway.app,*.vercel.app')
ALLOWED_HOSTS = [host.strip() for host in ALLOWED_HOSTS_RAW.split(',') if host.strip()]

# Database
DATABASES = {
    "default": dj_database_url.config(
        default=config("DATABASE_URL")
    )
}

SECURE_SSL_HOST = None  # Let Railway handle SSL

# ===== SESSION CONFIGURATION =====
SESSION_ENGINE = 'django.contrib.sessions.backends.db'
SESSION_COOKIE_HTTPONLY = True  # Prevent JavaScript access
SESSION_COOKIE_SAMESITE = 'None'  # Allow cross-site requests
SESSION_COOKIE_SECURE = True  # HTTPS only

# ===== CSRF SETTINGS (FIXED) =====
CSRF_COOKIE_HTTPONLY = False  # Frontend needs to read CSRF token
CSRF_COOKIE_SAMESITE = 'None'  # Must match session cookie for cross-origin
CSRF_COOKIE_SECURE = True  # HTTPS only
CSRF_USE_SESSIONS = False  # Use cookies instead of sessions for CSRF tokens
CSRF_COOKIE_NAME = 'csrftoken'  # Explicit name
CSRF_HEADER_NAME = 'HTTP_X_CSRFTOKEN'  # Header name Django expects
CSRF_COOKIE_AGE = 31449600  # 1 year in seconds

# CSRF Trusted Origins - MAKE SURE TO SET THIS IN ENVIRONMENT PRD
CSRF_TRUSTED_ORIGINS_RAW = config('CSRF_TRUSTED_ORIGINS', default='')
CSRF_TRUSTED_ORIGINS = [origin.strip() for origin in CSRF_TRUSTED_ORIGINS_RAW.split(',') if origin.strip()] if CSRF_TRUSTED_ORIGINS_RAW else []

# Debug: Print the actual values being used
print(f"DEBUG - CSRF_TRUSTED_ORIGINS_RAW: {repr(CSRF_TRUSTED_ORIGINS_RAW)}")
print(f"DEBUG - CSRF_TRUSTED_ORIGINS: {CSRF_TRUSTED_ORIGINS}")

# Security settings for production
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# ===== HTTPS SETTINGS =====
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# ===== CORS SETTINGS =====
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS_RAW = config('CORS_ALLOWED_ORIGINS', default='')
CORS_ALLOWED_ORIGINS = [origin.strip() for origin in CORS_ALLOWED_ORIGINS_RAW.split(',') if origin.strip()] if CORS_ALLOWED_ORIGINS_RAW else []

# ===== ADDITIONAL CORS HEADERS =====
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# CORS expose headers so frontend can access them
CORS_EXPOSE_HEADERS = [
    'Set-Cookie',
]

# Production-specific Celery settings
CELERY_BROKER_URL = config('CELERY_BROKER_URL', default='')
CELERY_RESULT_BACKEND = config('CELERY_RESULT_BACKEND', default='')

# ===== ADMIN IP WHITELIST (PRODUCTION ONLY) =====
# Get individual IPs from environment variables
HOME_IP = config('HOME_IP', default='').strip()
OFFICE_IP = config('OFFICE_IP', default='').strip()

# Get comma-separated list from environment variable
ADMIN_IPS_STRING = config('ADMIN_ALLOWED_IPS', default='').strip()

# Build the final list
ADMIN_ALLOWED_IPS = []

# Add individual IPs if they exist
if HOME_IP:
    ADMIN_ALLOWED_IPS.append(HOME_IP)
if OFFICE_IP:
    ADMIN_ALLOWED_IPS.append(OFFICE_IP)

# Add comma-separated IPs if they exist
if ADMIN_IPS_STRING:
    additional_ips = [ip.strip() for ip in ADMIN_IPS_STRING.split(',') if ip.strip()]
    ADMIN_ALLOWED_IPS.extend(additional_ips)

# Remove duplicates
ADMIN_ALLOWED_IPS = list(set(ADMIN_ALLOWED_IPS))

# Debug: Print the IPs being used (remove this after confirming it works)
print(f"DEBUG - ADMIN_ALLOWED_IPS: {ADMIN_ALLOWED_IPS}")


# Logging for production
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'logs' / 'django.log',
            'formatter': 'verbose',
        },
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'level': 'INFO',
        'handlers': ['file', 'console'],
    },
    'loggers': {
        'django': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': False,
        },
        'estates': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': False,
        },
        # Add CSRF debugging
        'django.security.csrf': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'admin_security': {
            'handlers': ['file', 'console'],
            'level': 'WARNING',
            'propagate': False,
        },
        
    },
}

# Ensure logs directory exists
os.makedirs(BASE_DIR / 'logs', exist_ok=True)

# ===== DEBUGGING SETTINGS (Remove after fixing) =====
print(f"CORS_ALLOWED_ORIGINS: {CORS_ALLOWED_ORIGINS}")
print(f"CSRF_TRUSTED_ORIGINS: {CSRF_TRUSTED_ORIGINS}")
print(f"CSRF_COOKIE_SAMESITE: {globals().get('CSRF_COOKIE_SAMESITE', 'Not Set')}")
print(f"CSRF_COOKIE_HTTPONLY: {globals().get('CSRF_COOKIE_HTTPONLY', 'Not Set')}")