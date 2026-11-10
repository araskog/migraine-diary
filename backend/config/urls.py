from django.contrib import admin
from django.urls import path

from accounts import views
from health.views import health

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health),
    path("api/session/", views.session),
    path("api/register/", views.register),
    path("api/sign-in/", views.sign_in),
    path("api/sign-out/", views.sign_out),
    path("api/diary/", views.diary),
]
