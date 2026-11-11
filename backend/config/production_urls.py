from django.urls import path
from django.views.generic import TemplateView

from .urls import urlpatterns

urlpatterns = [*urlpatterns, path("", TemplateView.as_view(template_name="index.html"))]
