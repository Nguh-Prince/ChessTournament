from django.urls import path
from icecream import ic
from . import api_views as views

from rest_framework import routers

app_name = "api"

router = routers.DefaultRouter(trailing_slash=True)
router.register("tournaments", views.TournamentViewSet, basename="tournaments")

urlpatterns = [
    path("fixtures/<int:pk>/", views.FixtureDetail.as_view(), name="fixture-detail"),
    path("games/<int:pk>/", views.GameDetail.as_view(), name="game-detail"),
    path("players/", views.PlayersList.as_view(), name="players"),
    path(
        "players/<int:player_id>/tournaments/",
        views.PlayerTournamentsList.as_view(),
        name="player_tournaments",
    ),
    path(
        "playerfixtures/<int:pk>/",
        views.PlayerFixtureDetail.as_view(),
        name="player-fixture-detail",
    ),
    # path("tournaments/", views.TournamentsList.as_view(), name="tournaments"),
    # path(
    #     "tournaments/<int:pk>/",
    #     views.TournamentDetail.as_view(),
    #     name="tournament-detail",
    # ),
    path(
        "tournaments/enroll/",
        views.EnrollPlayerSerializer.as_view(),
        name="tournaments",
    ),
    path(
        "tournamentplayers/<int:pk>/",
        views.TournamentPlayerDetail.as_view(),
        name="tournamentplayer-detail",
    ),
    path(
        "tournaments/<int:tournament_id>/games/",
        views.TournamentGames.as_view(),
        name="tournament-games",
    ),
    path(
        "tournaments/<int:tournament_id>/fixtures/",
        views.TournamentFixtures.as_view(),
        name="tournament-fixtures",
    ),
    path(
        "tournaments/<int:tournament_id>/fixtures/<int:round>/",
        views.TournamentFixtures.as_view(),
        name="tournament-round-fixtures",
    ),
]

urlpatterns += router.urls

ic(router.urls)
