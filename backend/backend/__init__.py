from .celery import app as celery_app

__all__ = ['celery_app']
# This will ensure that the Celery app is loaded when Django starts.