from django.urls import path, include
from . import views

app_name = "app"

urlpatterns = [
    path('', views.test),
    path('login/', views.login_view, name='login'),
    path('signup/', views.signup, name='signup'),
    path('accounts/', include('allauth.urls')),
]