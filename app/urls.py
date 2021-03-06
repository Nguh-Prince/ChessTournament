from unicodedata import name
from django.http import HttpResponse
from django.shortcuts import redirect

from django.urls import include, path

from . import views

app_name = "app"

urlpatterns = [
    path("", views.index, name="index"),
    path("login/", views.login_view, name="login"),
    path("logout/", views.logout_view, name="logout"),
    path("signup/", views.signup, name="signup"),
    path("home/", views.home, name="home"),
    path("home/tournaments/", views.tournaments, name="tournaments"),
    path(
        "home/tournaments/<int:tournament_id>/",
        views.tournament_detail,
        name="tournament-detail",
    ),
    path("create-person/", views.create_person, name="create-person"),
    path("signup/check/", views.check_uniqueness),
    path("api/", include("app.api_urls")),
]
