from unicodedata import name
from django.urls import path
from . import views

app_name = "api"

urlpatterns = [
    path('tournaments/', views.TournamentsList.as_view(), name='tournaments'),
]