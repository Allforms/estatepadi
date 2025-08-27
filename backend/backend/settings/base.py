"""
Django base settings for backend project.
Contains common settings shared between development and production.
"""

from pathlib import Path
import os

# Smart config function that works for both local and production
def smart_config(key, default=None, cast=None):
    """
    Hybrid config function:
    - Uses os.environ for production (Railway, Docker, etc.)
    - Falls back to python-decouple for local development
    """
    value = None
    
    # Check if we're in production environment (Railway, Docker, etc.)
    is_production = any([
        os.environ.get('RAILWAY_ENVIRONMENT'),
        os.environ.get('PORT'),
        os.environ.get('DJANGO_ENVIRONMENT') == 'production'
    ])
    
    if is_production:
        # Production: use os.environ directly
        value = os.environ.get(key, default)
    else:
        # Local development: try decouple first, fallback to os.environ
        try:
            from decouple import config as decouple_config
            value = decouple_config(key, default=default)
        except (ImportError, Exception):
            value = os.environ.get(key, default)
    
    # Apply casting if provided
    if value is not None and cast:
        if cast == bool:
            return str(value).lower() in ('true', '1', 'yes', 'on')
        else:
            try:
                return cast(value)
            except (ValueError, TypeError):
                return default
    
    return value

# Use the smart config function
config = smart_config

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'estates',
    'rest_framework.authtoken'
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.middleware.common.CommonMiddleware',
    'estates.middleware.admin_ip_whitelist.AdminIPWhitelistMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'

# Custom user model
AUTH_USER_MODEL = 'estates.User'

# REST Framework settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.UserRateThrottle',
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.ScopedRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'user': '1000/day',
        'anon': '100/hour',
        'burst': '60/minute',     # burst limit
    }    
}


# Cache for rate limiting
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}
# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')


# Session settings
SESSION_COOKIE_AGE = 1209600  # 2 weeks

# Email settings (Postmark) - with defaults for missing vars
POSTMARK_TOKEN = config('POSTMARK_TOKEN', default='')
POSTMARK_SENDER = config('POSTMARK_SENDER', default='noreply@localhost') 
EMAIL_BACKEND = 'postmarker.django.EmailBackend'
POSTMARK = {
    'TOKEN': POSTMARK_TOKEN,
    'SENDER': POSTMARK_SENDER,
}
DEFAULT_FROM_EMAIL = 'info@estatepadi.com'

# Celery settings
CELERY_BROKER_URL = config('CELERY_BROKER_URL', default='redis://localhost:6379/0')
CELERY_RESULT_BACKEND = config('CELERY_RESULT_BACKEND', default='redis://localhost:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'

# Paystack settings - with defaults
PAYSTACK_SECRET_KEY = config('PAYSTACK_SECRET_KEY', default='')
PAYSTACK_PUBLIC_KEY = config('PAYSTACK_PUBLIC_KEY', default='')

# Bunny storage settings - with defaults
BUNNY_STORAGE_ZONE = config('BUNNY_STORAGE_ZONE', default='')
BUNNY_STORAGE_PASSWORD = config('BUNNY_STORAGE_PASSWORD', default='')
BUNNY_CDN_URL = config('BUNNY_CDN_URL', default='')
BUNNY_REGION = ''

STORAGES = {
    'default': {
        'BACKEND': 'estates.bunny_storage.BunnyStorage',
    },
    'staticfiles': {
        'BACKEND': "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
    
}

MEDIA_URL = BUNNY_CDN_URL + '/'
MEDIA_ROOT = '' 

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'