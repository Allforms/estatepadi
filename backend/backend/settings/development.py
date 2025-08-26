"""
Django development settings.
"""

from .base import *
import dj_database_url

# SECURITY WARNING: keep the secret key used in production secret!
# Use a different secret key for development
SECRET_KEY = config('SECRET_KEY', default='django-insecure-)!8sh3=qk2^!nd6*%tu39lpx3*8xpvdnql9z+(h=soz6#4u!yu')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

# Allow all hosts in development
ALLOWED_HOSTS = ['*']

# Database - Use PostgreSQL via DATABASE_URL or fallback to SQLite
DATABASES = {
    'default': dj_database_url.config(
        default=config('DATABASE_URL', default='sqlite:///' + str(BASE_DIR / 'db.sqlite3'))
    )
}

# CORS settings for development
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173", 
]

CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# Additional development-specific settings
INTERNAL_IPS = [
    '127.0.0.1',
    'localhost',
]


# Development-specific logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
        },
        'estates': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
    },
}