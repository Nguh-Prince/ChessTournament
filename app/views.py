from django.contrib.auth import login as login
from django.contrib.auth import logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.http import Http404, HttpResponse
from django.shortcuts import redirect, render
from django.utils.translation import gettext as _
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view, renderer_classes
from rest_framework.renderers import JSONRenderer

from app.forms import GameForm, PlayerForm

from . import models, serializers

from icecream import ic

CLASSROOMS = ["B1A", "B1B", "L1A", "L1B", "L1C", "L1D", "L1E", "L1F", "L1G", "L1H", "B2", "L2A", "L2B", "L2C", "L2D", "L2E", "SE3", "GL3A", "GL3B", "GL3C", "SR3A", "SR3B", "SR3C"]

def login_view(request):
    context = {"errors": [], "successes": []}
    print("In login_view")
    if request.method == "POST":
        identifier = request.POST.get("identifier")
        password = request.POST.get("password")

        try:
            user = User.objects.get(username=identifier)
        except User.DoesNotExist as e:
            context["errors"].append(_("Username or password incorrect"))
            return render(request, "app/signin.html", context=context)

        if not user.check_password(password):
            context["errors"].append(_("Username or password incorrect"))
            return render(request, "app/signin.html", context=context)

        login(request, user, backend="django.contrib.auth.backends.ModelBackend")

        if not user.is_active:
            return HttpResponse(_("Your account is currently inactive"))

        try:
            request.session["player"] = serializers.PlayerSerializer(user.player).data

            response = redirect("app:home")
            response.set_cookie("player_id", user.player.id)
        except models.Player.DoesNotExist as e:
            return redirect("app:create-person")

        return response

    return render(request, "app/signin.html")

def index(request):
    print("Running index")
    # if request.user.is_authenticated:
    #     return redirect("app:home")
    return render(request, "app/index.html")


def home(request):
    return render(request, "app/home.html")


def tournaments(request):
    return render(request, "app/tournaments.html")


def tournament_detail(request, tournament_id):
    check_query = models.Tournament.objects.filter(id=tournament_id)

    if check_query.count() < 1:
        raise Http404

    response = render(
        request,
        "app/tournament_detail.html",
        context={"tournament": check_query.first(), "game_form": GameForm},
    )

    response.set_cookie("tournament_id", tournament_id)

    return response


def signup(request):
    if request.user.is_authenticated:
        return redirect("app:home")

    context = {"errors": [], "classrooms": CLASSROOMS}
    
    if request.method == "POST":
        names = request.POST.get("name")
        username = request.POST.get("username")
        password = request.POST.get("password")
        ic(request.POST)
        form = PlayerForm(request.POST, request.FILES)

        if len(names.split(' ')) < 2:
            context["errors"].append(_("First and last name required"))
        else:
            names = names.split()

        if not username:
            context["errors"].append(_("Username required"))

        if not password:
            context["errors"].append( _("Password required") )


        if User.objects.filter(username=username).count() > 0:
            context["errors"].append(_("Username already exists"))

        if len(context["errors"]) < 1 and form.is_valid():  # no errors in the form
            # create the player and a user
            player = form.save()
            player.first_name = names[0]
            player.last_name = names[-1]
            player.email = player.email if player.email is not None else ""

            user = User.objects.create(username=username, is_active=True, email=player.email)
            user.set_password(password)
            user.save()
            player.user = user
            player.save()

            return redirect("app:login")
        else:
            ic( len(context["errors"]), form.is_valid() )
            context["errors"] = form.errors
            print(form.errors)

    return render(request, "app/signup.html", context=context)


@login_required
def logout_view(request):
    logout(request)
    return redirect("app:login")


@login_required
def create_person(request):
    context = {"errors": [], 'classrooms': CLASSROOMS}

    if request.method == "POST":
        if models.Player.objects.filter(
            user=request.user
        ):  # user already has a player instance
            return redirect("app:home")

        name = request.POST.get("name")
        phone = request.POST.get("phone")
        email = request.POST.get("email")
        classroom = request.POST.get("classroom")
        gender = request.POST.get("gender")

        if len(name.split(" ")) < 2:
            context["errors"].append(_("At least two names are required"))

        if models.Player.objects.filter(phone=phone).count() > 0:
            context["errors"].append(_("A user with this phone number already exists"))

        if models.Player.objects.filter(email=email).count() > 0:
            context["errors"].append(_("A user with this phone number already exists"))

        if len(context["errors"]) < 1:
            names = name.split(" ")
            models.Player.objects.create(
                first_name=names[0],
                last_name=names[-1],
                phone=phone,
                classroom=classroom,
                user=request.user,
                email=email,
                gender=gender,
            )
            return redirect("app:home")

    return render(request, "app/create-person.html", context=context)


@api_view(("GET",))
@renderer_classes([JSONRenderer])
def get_usernames_phones_telegram(request):
    usernames_list = [f.username for f in User.objects.all() if f.username]
    people_phones = [f.phone for f in models.Player.objects.all() if f.phone]
    people_telegram_usernames = [
        f.telegram_username for f in models.Player.objects.all() if f.telegram_username
    ]

    return Response(
        data={
            "usernames": usernames_list,
            "phone_numbers": people_phones,
            "telegram_usernames": people_telegram_usernames,
        },
        status=status.HTTP_200_OK,
    )
