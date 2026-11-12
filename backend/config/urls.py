from django.contrib import admin
from django.urls import path

from accounts import views
from accounts.password_reset import confirm_reset, request_reset
from diary.views import entries
from health.views import health

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health),
    path("api/session/", views.session),
    path("api/register/", views.register),
    path("api/password-reset/", request_reset),
    path("api/password-reset/confirm/", confirm_reset),
    path("api/sign-in/", views.sign_in),
    path("api/sign-out/", views.sign_out),
    path("api/diary/", views.diary),
    path("api/diary/entries/", entries),
]
