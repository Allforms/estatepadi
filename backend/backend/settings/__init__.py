"""
Django settings package initialization.
With Simple Railway-compatible settings initialization
Automatically imports the appropriate settings module based on environment.
"""

import os

# Railway automatically sets environment variables
# Check if we're in production based on common Railway indicators
IS_PRODUCTION = (
    os.environ.get('RAILWAY_ENVIRONMENT') == 'production' or
    os.environ.get('DJANGO_ENVIRONMENT') == 'production' or
    'railway.app' in os.environ.get('RAILWAY_PUBLIC_DOMAIN', '') or
    os.environ.get('PORT') is not None  # Railway sets PORT for production
)

if IS_PRODUCTION:
    print("Loading production settings...")
    from .production import *
else:
    print("Loading development settings...")
    from .development import *