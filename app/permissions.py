from .models import *

from rest_framework import permissions

class IsCreatorOr403(permissions.BasePermission):
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

class IsTournamentCreatorOrPlayerOrReadOnly(permissions.BasePermission):
    # tournamentplayer permission; only the creator of a tournament can modify, or delete the tournamentplayer records associated with that tournament
    def has_object_permission(self, request, view, obj):
        player_id = None

        try:
            player_id = request.user.player.id
        except Exception as e:
            print(e)

        if request.method in permissions.SAFE_METHODS or obj.tournament.creator.id == player_id:
            return True

        if not player_id:
            return False
        
        if obj.player.id == player_id and request.method == 'DELETE':
            return True
        
        return False

class IsTournamentCreatororReadOnly(permissions.BasePermission):  # permission ensures that only the creator of a tournament can add, delete or modify games
    def has_object_permission(self, request, view, obj):
        player_id = None

        try:
            player_id = request.user.player.id
        except Exception as e:
            print(e)

        if request.method in permissions.SAFE_METHODS or obj.fixture.tournament.creator.id == player_id:
            return True

        if not player_id:
            return False
        
        return False

class TournamnentNotStartedOrReadONly(permissions.BasePermission): # permission ensures that once a tournament is started, it cannot be modified
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS or not obj.started:
            return True

        return False
