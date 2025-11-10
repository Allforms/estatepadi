from django.conf import settings
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("api/", include("estates.urls"))
]

# Only include admin if in development
if settings.DEBUG:
    urlpatterns += [path("admin/", admin.site.urls)]
else:
    # In production, keep it at a non-obvious path (optional)
    urlpatterns += [path("super-secret-admin-path-path-yaba-lagos/", admin.site.urls)]
