from unicodedata import name
from django.urls import path, include
from . import views

app_name = "app"

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('signup/', views.signup, name='signup'),
    path('accounts/', include('allauth.urls')),
    path('home/', views.home, name="home"),
    path('tournaments/', views.tournaments, name="tournaments"),
    path('api/', include("app.api_urls")),
]