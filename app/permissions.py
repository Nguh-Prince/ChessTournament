from urllib import request

from rest_framework import permissions

from .models import *


class IsCreatorOr403(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        player_id = None

        if request.method in permissions.SAFE_METHODS:
            return True

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

        if (
            request.method in permissions.SAFE_METHODS
            or obj.tournament.creator.id == player_id
        ):
            return True

        if not player_id:
            return False

        if obj.player.id == player_id and request.method == "DELETE":
            return True

        return False


class IsTournamentCreatororReadOnly(
    permissions.BasePermission
):  # permission ensures that only the creator of a tournament can add, delete or modify games
    def has_object_permission(self, request, view, obj):
        player_id = None

        try:
            player_id = request.user.player.id
        except Exception as e:
            print(e)

        if isinstance(obj, Game):
            if (
                request.method in permissions.SAFE_METHODS
                or obj.fixture.tournament.creator.id == player_id
            ):
                return True
        if isinstance(obj, Fixture):
            if (
                request.method in permissions.SAFE_METHODS
                or obj.tournament.creator.id == player_id
            ):
                return True
        if isinstance(obj, PlayerFixture):
            if (
                request.method in permissions.SAFE_METHODS
                or obj.fixture.tournament.creator.id == player_id
            ):
                return True

        if not player_id:
            return False

        return False


class UnfinishedOrReadOnly(permissions.BasePermission):
    # only a fixture that is finished can be modified
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        player_id = None

        try:
            player_id = request.user.player.id
        except Exception as e:
            print(e)

        if (
            obj.tournament
            and obj.tournament.creator.id == player_id
            and not obj.finished
        ):
            return True

        return False


class TournamnentNotStartedOrReadONly(
    permissions.BasePermission
):  # permission ensures that once a tournament is started, it cannot be modified
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS or not obj.started:
            return True

        return False


class TournamentIsStartedOrNoUpdate(permissions.BasePermission):
    # permission ensures that a tournamentplayer, fixture, game, playerfixture, playerfixturegame can only be modified when their tournaments have started
    ic(permissions.SAFE_METHODS)

    def has_object_permission(self, request, view, obj):
        tournament_started = False

        if isinstance(obj, TournamentPlayer) or isinstance(obj, Fixture):
            tournament_started = obj.tournament.started

        if isinstance(obj, Game) or isinstance(obj, PlayerFixture):
            tournament_started = obj.fixture.tournament

        if isinstance(obj, PlayerFixtureGame):
            tournament_started = obj.game.fixture.tournament

        if tournament_started:
            return True

        if request.method not in ["PUT", "PATCH"]:
            return True

        elif not tournament_started and request.method in ["PUT", "PATCH"]:
            return False

        return False
