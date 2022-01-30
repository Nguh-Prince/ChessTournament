from unicodedata import name
from django.urls import path
from . import api_views as views

app_name = "api"

urlpatterns = [
    path('players/', views.PlayersList.as_view(), name='players'),
    path('players/<int:player_id>/tournaments/', views.PlayerTournamentsList.as_view(), name='player_tournaments'),
    path('tournaments/', views.TournamentsList.as_view(), name='tournaments'),
]