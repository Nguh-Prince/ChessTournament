from . import models
from . import serializers

from django.contrib.auth import login as login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.http import HttpResponse
from django.shortcuts import redirect, render
from django.template import context
from django.utils.translation import gettext as _

from rest_framework.generics import ListCreateAPIView

def login_view(request):
    context = {'errors': [], 'successes': []}
    print("In login_view")
    if request.method == "POST":
        identifier = request.POST.get("identifier")
        password = request.POST.get("password")

        try:
            user = User.objects.get(username=identifier)
        except User.DoesNotExist as e:
            context["errors"].append( _("Username or password incorrect") )
            return render(request, "app/signin.html", context=context)

        if not user.check_password(password):
            context["errors"].append( _("Username or password incorrect") )
            return render(request, "app/signin.html", context=context)


        if not user.is_active:
            return HttpResponse( _("Your account is currently inactive") )
        
        login(request, user)
        context["successes"].append( _("Login successful") )
        return redirect("app:test")

    return render(request, 'app/signin.html')

def test(request):
    return render(request, "app/base.html")

def signup(request):
    context = {'errors': []}
    if request.method == "POST":
        names = request.POST.get("name")
        phone = request.POST.get("phone")
        email = request.POST.get("email")
        classroom = request.POST.get("classroom")
        gender = request.POST.get("gender")
        password = request.POST.get("password")
        username = request.POST.get("username")

        if len(names) < 2:
            context["errors"].append( _("First and last name required") )
        else:
            names = names.split()
        
        if not phone:
            context["errors"].append( _("Phone number required") )
        
        if not gender:
            context["errors"].append( _("Gender required") )

        if not password:
            context["errors"].append( _("Password required") )

        if not username:
            context["errors"].append( _("Username required") )

        if User.objects.filter(username=username).count() > 0:
            context["errors"].append( _("Username already exists") )
        
        if len(context["errors"]) < 1: # no errors in the form
            # create the player and an inactive user
            player = models.Player.objects.create(first_name=names[0], last_name=names[-1], classroom=classroom, gender=gender, phone=phone)
            user = User.objects.create(username=username, is_active=False, email=email)
            user.set_password(password)
            player.user = user
            player.save()

            return redirect("app:login")
    
    return render(request, "app/signup.html", context=context)

@login_required
def logout_view(request):
    logout(request)
    return redirect("app:login")

# API class-based views
class TournamentsList(ListCreateAPIView):
    queryset = models.Tournament.objects.all()

    serializer_class = serializers.TournamentSerializer