from django.urls import path, include
from . import views

app_name = "app"

urlpatterns = [
    path('', views.test),
    path('login/', views.login, 'login'),
    path('signup/', views.signup, 'signup'),
    path('accounts/', include('allauth.urls')),
]