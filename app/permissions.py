from .models import *

from rest_framework import permissions

class IsOwnerOr403(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        player_id = None

        try:
            player_id = request.user.player.id
        except Exception as e:
            print(e)

        if not player_id or obj.creator.id != player_id:
            return False
        else:
            return True