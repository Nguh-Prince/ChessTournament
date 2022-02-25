from app import serializers

from django.http import HttpResponse
from django.shortcuts import redirect
from django.utils.translation import gettext as _

import re


class Middleware:
    def __init__(self, get_response) -> None:
        self.get_response = get_response

    def __call__(self, request) -> None:
        login_regex = re.compile("login/")
        if not request.user.is_authenticated and not login_regex.search(request.path):
            return redirect("app:login")

        else:
            try:
                player = (
                    request.user.player
                )  # if the user has a player account set the player_id cookie to player id
                request.session["player"] = serializers.PlayerSerializer(player).data

                response = self.get_response(request)
                response.set_cookie("player_id", player.id)

                return response
            except AttributeError:
                return self.get_response
