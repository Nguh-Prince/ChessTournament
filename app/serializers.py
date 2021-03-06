from django.db.models import Q
from django.utils.translation import gettext as _
from icecream import ic
from rest_framework import serializers
from rest_framework.serializers import ValidationError
from drf_extra_fields.fields import Base64ImageField, Base64FileField

from . import models
from .utilities import is_power_of_2


class PlayerSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Player
        fields = (
            "id",
            "first_name",
            "last_name",
            "phone",
            "level",
            "classroom",
            "email",
            "gender",
            "image",
            "telegram_username",
            "name",
        )


class TournamentPlayerSerializer(serializers.ModelSerializer):
    player = PlayerSerializer(read_only=True)

    class Meta:
        model = models.TournamentPlayer
        fields = ("id", "player", "tournament", "player", "participating", "kicked_out")

    def validate(self, attrs):
        if (
            attrs["participating"]
            and attrs["kicked_out"]
            and attrs["participating"] != attrs["kicked_out"]
            and attrs["participating"] == False
        ):  # cannot be kicked out of a tournament you're not participating in
            raise ValidationError(
                _(
                    "Player cannot be kicked out of a tournament they are not participating in"
                )
            )
        return super().validate(attrs)


class TournamentSerializer(serializers.ModelSerializer):
    participants_enrolled = serializers.IntegerField(
        source="enrolled_participants.count", read_only=True
    )
    creator_details = PlayerSerializer(read_only=True, source="creator")
    participants = TournamentPlayerSerializer(
        read_only=True, source="tournamentplayer_set", many=True
    )
    image = Base64ImageField(required=False)
    terms = Base64FileField(required=False)

    class Meta:
        model = models.Tournament
        fields = (
            "id",
            "name",
            "total_number_of_participants",
            "participants_enrolled",
            "creator",
            "creator_details",
            "time_created",
            "participants",
            "number_of_points_for_draw",
            "number_of_points_for_win",
            "number_of_points_for_loss",
            "image",
            "terms",
        )

    def validate(self, attrs):
        ic(attrs)
        value = attrs["total_number_of_participants"]
        # must be a power of 2 and greater than 1
        if value <= 1:
            raise serializers.ValidationError(
                _("The total number of participants must be greater than 1")
            )
        if not is_power_of_2(value):
            raise serializers.ValidationError(
                _(
                    "The total number of participants must be a power of 2 i.e 2, 4, 8, 16, 32, etc."
                )
            )

        value = attrs["name"]
        if self.Meta.model.objects.filter(name=value, completed=False).count() > 1:
            raise ValidationError(
                _("There is another active tournament with the same name")
            )

        if (
            attrs["number_of_points_for_win"] == attrs["number_of_points_for_loss"]
            or attrs["number_of_points_for_loss"] == attrs["number_of_points_for_draw"]
            or attrs["number_of_points_for_draw"] == attrs["number_of_points_for_win"]
        ):
            raise ValidationError(
                _(
                    "The number of points for a win, draw and loss must be different from each other"
                )
            )

        return attrs


class TournamentEnrollSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.TournamentPlayer
        fields = (
            "player",
            "tournament",
        )

class LookupSerializer(serializers.Serializer):
    field = serializers.CharField(max_length=100)
    value = serializers.CharField(max_length=100)

class PlayerFixtureGameSerializer(serializers.ModelSerializer):
    scores = serializers.FloatField(
        source="get_sum_of_scores_before_game", read_only=True
    )
    player = TournamentPlayerSerializer(source='playerfixture.player', read_only=True)

    class Meta:
        model = models.PlayerFixtureGame
        fields = ("id", "playerfixture", "score", "is_home", "scores", "player")

    def validate(self, attrs):
        ic(attrs)
        # score must be the tournament.number_of_points_for_draw, tournament_number_of_points_for_loss, or tournament.number_of_points_for_win
        if attrs["playerfixture"].fixture.tournament:
            tournament: models.Tournament = attrs["playerfixture"].fixture.tournament
            tournament_points = [
                tournament.number_of_points_for_win,
                tournament.number_of_points_for_draw,
                tournament.number_of_points_for_loss,
            ]

            if attrs["score"] not in tournament_points:
                raise ValidationError(
                    _("The score for this game must be either be %(list)s")
                    % {"list": ", ".join(tournament_points)}
                )

        return attrs


class GameSerializer(serializers.ModelSerializer):
    players = PlayerFixtureGameSerializer(many=True, source="playerfixturegame_set")

    class Meta:
        model = models.Game
        fields = (
            "id",
            "time",
            "fixture",
            "players",
            "classroom",
            "minutes_per_player",
            "__str__",
        )
        extra_kwargs = {"players": {"validators": []}}

    def validate(self, attrs):
        ic(attrs)
        ic(self.context["request"].method)
        tournament: models.Tournament = attrs["fixture"].tournament
        tournament_points = {
            "win": tournament.number_of_points_for_win,
            "draw": tournament.number_of_points_for_draw,
            "loss": tournament.number_of_points_for_loss,
        }

        if attrs["fixture"].children.filter(game__time__gt=attrs["time"]).count() > 0:
            raise serializers.ValidationError(
                _(
                    "This game must have a time greater than or equal to that of the games in the previous fixtures"
                )
            )

        if (
            len(attrs["playerfixturegame_set"]) != 2
            and len(attrs["playerfixturegame_set"]) > 0
        ):
            raise serializers.ValidationError(_("A game can only have 2 players"))

        if attrs["fixture"] and attrs["fixture"].children.filter(
            game__time__gte=attrs["time"]
        ):
            raise serializers.ValidationError(
                _(
                    "This game cannot be played before or at the same time as a game in a fixture preceding this game's fixture"
                )
            )

        if (
            attrs["fixture"]
            and attrs["fixture"].game_set.filter(time=attrs["time"])
            and self.context["request"].method == "POST"
        ):
            raise serializers.ValidationError(
                _("Another game is being played at the same time as this game")
            )

        home_count, away_count, win_count, draw_count, loss_count = 0, 0, 0, 0, 0
        for player in attrs["playerfixturegame_set"]:
            if player["score"] == tournament_points["win"]:
                win_count += 1
            if player["score"] == tournament_points["draw"]:
                draw_count += 1
            if player["score"] == tournament_points["loss"]:
                loss_count += 1

            if attrs["fixture"] and player["playerfixture"].fixture != attrs["fixture"]:
                raise serializers.ValidationError(
                    _("This game can only be played by players in its fixture")
                )
            if player["is_home"]:
                home_count += 1
            else:
                away_count += 1

        ic(home_count, away_count, len(attrs["playerfixturegame_set"]) > 0)
        if len(attrs["playerfixturegame_set"]) > 0:
            if home_count != away_count and home_count != 1 and away_count != 1:
                raise serializers.ValidationError(
                    _("There can only be one home and one away player")
                )

        if win_count > 1 or loss_count > 1:
            raise serializers.ValidationError(
                _("The number of wins and losses for a game cannot exceed 1")
            )
        if draw_count > 2:
            raise serializers.ValidationError(
                _("The number of draws for a game cannot exceed 2")
            )
        if draw_count != 2 and draw_count != 0:
            raise serializers.ValidationError(
                _("The number of draws for a game can either be 2 or 0")
            )
        if win_count != loss_count:
            raise serializers.ValidationError(
                _("The number of wins must be equal to the number of losses")
            )

        return attrs

    def create(self, validated_data):
        ic(validated_data)
        game_players = validated_data.pop("playerfixturegame_set")
        game = models.Game.objects.create(**validated_data)

        for player in game_players:
            models.PlayerFixtureGame.objects.create(**player, game=game)

        return game

    def update(self, instance, validated_data):
        ic(validated_data)
        instance.playerfixturegame_set.all().delete()

        instance.classroom = validated_data["classroom"]
        instance.time = validated_data["time"]
        instance.minutes_per_player = validated_data["minutes_per_player"]
        instance.save()

        players = validated_data.pop("playerfixturegame_set")

        for player in players:
            models.PlayerFixtureGame.objects.create(**player, game=instance)

        return instance


import re


class PlayerFixtureSerializer(serializers.ModelSerializer):
    player = PlayerSerializer(source="player.player", read_only=True)

    class Meta:
        model = models.PlayerFixture
        fields = ("id", "is_winner", "fixture", "player")
        extra_kwargs = {"fixture": {"read_only": True}}

    id_regex = re.compile("playerfixtures/(\d+)")

    def validate(self, attrs):
        match_object = self.id_regex.search(self.context["request"].path)

        if match_object:
            id = match_object.group(1)
            ic(id)
            object = self.Meta.model.objects.filter(id=id).first()

            ic(object, object.fixture)
            fixture_winner = object.fixture.get_winner

            if "is_winner" in attrs:
                if attrs["is_winner"] and object.player.kicked_out:
                    raise serializers.ValidationError(
                        _(
                            "A player who has been kicked out of the tournament cannot be the winner of this fixture. "
                        )
                    )

                if (
                    attrs["is_winner"]
                    and object.fixture.playerfixture_set.filter(
                        Q(is_winner=True) & ~Q(id=object.id)
                    ).count()
                    > 0
                ):
                    raise serializers.ValidationError(
                        _("This fixture already has a winner")
                    )

                if attrs["is_winner"] and object.fixture.game_set.count() < 1:
                    raise serializers.ValidationError(
                        _("A winner cannot be set for a fixture with no games")
                    )

        return attrs

    def update(self, instance, validated_data):
        if instance.is_winner:
            instance.fixture.finished = True
            instance.fixture.save()
        return super().update(instance, validated_data)


class SimpleFixtureSerializer(serializers.ModelSerializer):
    participants = PlayerFixtureSerializer(
        source="playerfixture_set", read_only=True, many=True
    )
    id_regex = re.compile("fixtures/(\d+)")

    def validate(self, attrs):
        # a winner cannot be set when there are no games that have been played
        match_object = self.id_regex.search(self.context["request"].path)
        ic(attrs)
        if match_object:
            id = match_object.group(1)
            ic(id)
            object = self.Meta.model.objects.get(id=id)
            if "finished" in attrs and attrs["finished"] and not object.get_winner:
                raise serializers.ValidationError(
                    _("A fixture cannot be finished when it has no winner")
                )

        return attrs

    class Meta:
        model = models.Fixture
        fields = ("id", "root", "level", "level_number", "finished", "participants")
        extra_kwargs = {
            "root": {"read_only": True},
            "level": {"read_only": True},
            "level_number": {"read_only": True},
        }


class FixtureSerializer(serializers.ModelSerializer):
    winner = PlayerFixtureSerializer(source="get_winner", read_only=True)
    participants = PlayerFixtureSerializer(
        source="playerfixture_set", read_only=True, many=True
    )
    children = SimpleFixtureSerializer(read_only=True, many=True)
    id_regex = re.compile("fixtures/(\d+)")

    def validate(self, attrs):
        # a winner cannot be set when there are no games that have been played
        match_object = self.id_regex.search(self.context["request"].path)
        ic(attrs)
        if match_object:
            id = match_object.group(1)
            ic(id)
            object = self.Meta.model.objects.get(id=id)
            if "finished" in attrs and attrs["finished"] and not object.get_winner:
                raise serializers.ValidationError(
                    _("A fixture cannot be finished when it has no winner")
                )

        return attrs

    class Meta:
        model = models.Fixture
        fields = (
            "id",
            "__str__",
            "root",
            "level",
            "level_number",
            "finished",
            "participants",
            "winner",
            "children",
        )
        extra_kwargs = {
            "root": {"read_only": True},
            "level": {"read_only": True},
            "level_number": {"read_only": True},
        }

    def update(self, instance, validated_data):
        ic(validated_data)
        if validated_data["finished"]:
            winner = instance.get_winner
            winner.is_winner = True
            winner.save()

            instance.finished = validated_data["finished"]
            instance.save()

        return instance


class TournamentDetailSerializer(TournamentSerializer):
    all_players_enrolled = TournamentPlayerSerializer(
        read_only=True, source="tournamentplayer_set", many=True
    )
    fixtures = FixtureSerializer(read_only=True, source="fixture_set", many=True)
    # total_number_of_players_applied = serializers.IntegerField(source='tournamentplayer_set.count', read_only=True)
    class Meta:
        model = models.Tournament
        fields = (
            "id",
            "name",
            "total_number_of_participants",
            "participants_enrolled",
            "image",
            "terms",
            "creator",
            "creator_details",
            "time_created",
            "participants",
            "all_players_enrolled",
            "fixtures",
        )
