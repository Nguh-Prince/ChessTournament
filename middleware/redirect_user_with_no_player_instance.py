# this middleware redirects any authenticated user that does not have a player
# account to a page to create one
import re

from django.http import HttpResponse
from django.shortcuts import redirect

from app import models


class Middleware:
    def __init__(self, get_response) -> None:
        self.get_response = get_response

    def __call__(self, request) -> None:
        print("In redirect middleware")
        response = self.get_response(request)
        regex = re.compile("/create-person")
        
        if request.user.is_authenticated:
            if models.Player.objects.filter(
                user=request.user
            ).count() < 1 and not regex.search(request.path):
                return redirect("app:create-person")
            else:
                response.set_cookie("player_id", models.Player.objects.get(user=request.user).id)

        return response
