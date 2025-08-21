"""
Django settings package initialization.
Automatically imports the appropriate settings module based on environment.
"""

from decouple import config

# Get the environment setting (defaults to 'development')
ENVIRONMENT = config('DJANGO_ENVIRONMENT', default='development')

if ENVIRONMENT == 'production':
    from .production import *
elif ENVIRONMENT == 'development':
    from .development import *
else:
    raise ValueError(f"Unknown environment: {ENVIRONMENT}")