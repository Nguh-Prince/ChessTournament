from app import serializers

from django.http import HttpResponse
from django.shortcuts import redirect

class Middleware:
    def __init__(self, get_response) -> None:
        self.get_response = get_response

    def __call__(self, request) -> None:
        if not request.user.is_authenticated:
            return redirect("app:login")
        
        try:
            player = request.user.player
            request.session["player"] = serializers.PlayerSerializer(player).data

            response = self.get_response(request)
            response.set_cookie("player_id", player.id)

            return response
        except AttributeError:
            return HttpResponse(_("Your are not a player"))
    pass