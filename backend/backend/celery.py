import os
from celery import Celery
from celery.schedules import crontab  

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

app = Celery('backend')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# Celery Beat Schedule
app.conf.beat_schedule = {
    'sync-subscriptions-daily': {
        'task': 'estates.tasks.sync_subscriptions_from_paystack', 
        'schedule': crontab(hour=0, minute=0),  
    },
}
