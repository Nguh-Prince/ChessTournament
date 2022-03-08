import math

from django.contrib.auth.models import User
from django.db import models
from django.db.models import Q, Sum
from django.db.models.signals import post_save, pre_save

# from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _
from icecream import ic
from rest_framework.serializers import ValidationError

from .utilities import a_if_and_only_if_b, a_implies_b, is_power_of_2


class Player(models.Model):
    GENDER_CHOICES = (
        ("m", _("Male")),
        ("nb", _("Non binary")),
        ("rns", _("Rather not say")),
    )
    first_name = models.CharField(max_length=30, null=False)
    last_name = models.CharField(max_length=30, null=False)
    phone = models.CharField(max_length=20, unique=True)
    level = models.IntegerField(null=True, blank=True)
    classroom = models.CharField(max_length=5, null=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True)
    email = models.EmailField(null=True, blank=True)
    gender = models.CharField(max_length=3, choices=GENDER_CHOICES)
    image = models.ImageField()
    telegram_username = models.CharField(max_length=256, unique=True, null=True)

    def __str__(self) -> str:
        return f"{self.first_name} {self.last_name}: {self.classroom}"

    @property
    def name(self) -> str:
        return f"{self.first_name} {self.last_name}"

    class Meta:
        verbose_name = _("Player")
        verbose_name_plural = _("Players")


class GeometricProgression:
    def __init__(self, first_term: float, common_ratio: float) -> None:
        self.first_term = first_term
        self.common_ratio = common_ratio

    def nthTerm(self, n: int) -> float:
        return self.first_term * (self.common_ratio ** (n - 1))

    def sumOfNTerms(self, n: int) -> float:
        if self.common_ratio < 1:
            numerator, denominator = 1 - (self.common_ratio**n), 1 - self.common_ratio
        else:
            numerator, denominator = (self.common_ratio**n) - 1, self.common_ratio - 1

        return (self.first_term * numerator) / denominator

    def getSequencePositionofNumber(self, number) -> int:
        """
        given a number, this method returns its position in the progression
        """
        n = math.log((self.common_ratio * number) / self.first_term, self.common_ratio)

        return n if n.is_integer() else None


class TournamentCategory(models.Model):
    number_of_points_for_draw = models.FloatField()
    number_of_points_for_win = models.FloatField()
    number_of_points_for_loss = models.FloatField()
    name = models.CharField(null=False, blank=False, unique=True, max_length=50)
    image = models.ImageField()

    def __str__(self) -> str:
        return self.name

    class Meta:
        verbose_name = _("Tournament category")
        verbose_name_plural = _("Tournament categories")


def tournament_directory_path(instance, filename):
    return "tournament_{0}/{1}".format(instance.id, filename)


class Tournament(models.Model):
    category = models.ForeignKey(
        TournamentCategory, on_delete=models.PROTECT, null=True
    )
    time_created = models.DateTimeField(auto_now_add=True)
    creator = models.ForeignKey(Player, on_delete=models.CASCADE)
    total_number_of_participants = models.IntegerField(default=16)
    completed = models.BooleanField(default=False)
    started = models.BooleanField(default=False)
    name = models.CharField(max_length=150)
    common_levels = {2: _("Finals"), 4: _("Semi-finals"), 8: _("Quarter finals")}
    number_of_points_for_draw = models.FloatField(default=0.5)
    number_of_points_for_win = models.FloatField(default=1)
    number_of_points_for_loss = models.FloatField(default=0)
    image = models.ImageField(upload_to=tournament_directory_path)

    class Meta:
        verbose_name = _("Tournament")
        verbose_name_plural = _("Tournaments")

    def clean(self) -> None:
        # a tournament must have a total_number_participants that is a power of 2, i.e. 2, 4, 8, 16 and greater than 1 etc.
        if self.total_number_of_participants <= 1:
            raise ValidationError(
                _("The total number of participants must be greater than 1")
            )
        if not is_power_of_2(self.total_number_of_participants):
            raise ValidationError(
                _(
                    "The total number of participants must be a power of 2 i.e 2, 4, 8, 16, 32, etc."
                )
            )

        # two uncompleted tournaments cannot have the same name
        if Tournament.objects.filter(name=self.name, completed=False).count() > 1:
            raise ValidationError(
                _("There is another active tournament with the same name")
            )

        # a tournament cannot be started when the number of enrolled participants is less than the total_number_of_participants
        if (
            self.started
            and self.enrolled_participants() < self.total_number_of_participants
        ):
            raise ValidationError(
                _(
                    "Tournament can only be started when %(number)d participants have been enrolled"
                )
                % {"number": self.total_number_of_participants}
            )

        if self.completed and not self.started:
            raise ValidationError(
                _("A tournament cannot be completed when it has not yet started")
            )

        if (
            self.number_of_points_for_draw == self.number_of_points_for_loss
            or self.number_of_points_for_win == self.number_of_points_for_draw
            or self.number_of_points_for_win == self.number_of_points_for_loss
        ):
            raise ValidationError(
                _("The number of points for win, loss and draw must be different.")
            )

        return super().clean()

        # a tournament cannot be started when the number of enrolled participants is less than the total_number_of_participants
        # a tournament cannot be completed when it has not yet started
        # a tournament cannot be modified when it has started or is completed

    def number_of_fixtures(self):
        gp = GeometricProgression(self.total_number_of_participants // 2, 0.5)
        return gp.sumOfNTerms(gp.getSequencePositionofNumber(1))

    def create_fixtures(self):
        self.fixture_set.all().delete()
        number = 2  # start by creating the finals
        created_fixtures = {}
        while number <= self.total_number_of_participants:
            created_fixtures.setdefault(number // 2, [])
            rootFixtureCounter = 0
            thisLevelFixtureCounter = 0
            for i in range(number // 2):
                # create fixtures and append them to the appropriate level, while picking their roots from the appropriate level
                level = (
                    self.common_levels[number] if number <= 8 else f"Round of {number}"
                )
                fixture = Fixture.objects.create(
                    tournament=self, level_number=number // 2, level=level
                )
                created_fixtures[number // 2].append(fixture)

                if number // 2 > 1:
                    if thisLevelFixtureCounter < 2:
                        fixture.root = created_fixtures[number // 4][rootFixtureCounter]

                        thisLevelFixtureCounter += 1
                    else:  # increment the rootFixtureCounter after we've assigned two child fixtures to a fixture in that list
                        rootFixtureCounter += 1
                        thisLevelFixtureCounter = 1
                        fixture.root = created_fixtures[number // 4][rootFixtureCounter]

                fixture.save()

            number *= 2

    def assign_players_to_initial_fixtures(self):
        # this method randomly places enrolled players in the outermost fixtures, i.e. those that do not have any children
        outermost_fixtures = self.fixture_set.filter(children__isnull=True)
        enrolled_participants = self.enrolled_participants

        if (
            enrolled_participants.count() == outermost_fixtures.count() * 2
            and enrolled_participants.count() == self.total_number_of_participants
        ):
            j = 0
            for fixture in outermost_fixtures:
                for i in range(2):
                    playerfixture = PlayerFixture(
                        fixture=fixture, player=enrolled_participants[j + i]
                    )
                    playerfixture.clean()
                    playerfixture.save()

                j += 2

    @property
    def enrolled_participants(self):
        return self.tournamentplayer_set.filter(participating=True)

    def number_of_enrolled_participants(self):
        return self.enrolled_participants.count() if self.enrolled_participants else 0

    def __str__(self) -> str:
        return f"{self.name} : {self.category.name}"


def create_tournament_fixtures(sender, instance: Tournament, **kwargs):
    # create fixtures for a tournament once the tournament has been added or edited
    if (
        is_power_of_2(instance.total_number_of_participants)
        and not instance.clean()
        and instance.number_of_fixtures() != instance.fixture_set.count()
        and not instance.started
    ):
        instance.create_fixtures()


post_save.connect(create_tournament_fixtures, Tournament)


class TournamentPlayer(models.Model):
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE)
    player = models.ForeignKey(Player, on_delete=models.CASCADE)
    kicked_out = models.BooleanField(default=False)
    rating = models.FloatField(default=800)
    participating = models.BooleanField(
        default=False
    )  # when a player is accepted to compete in a tournament this becomes True

    def clean(self) -> None:
        # a tournamentcompetitor cannot be added to a tournament that already has its total_number_of_participants
        if (
            self.tournament.tournamentplayer_set.filter(participating=True).count()
            > self.tournament.total_number_of_participants
        ):
            raise ValidationError(_("The tournament is already full."))

    class Meta:
        unique_together = [["tournament", "player"]]
        verbose_name = _("Tournament participant")
        verbose_name_plural = _("Tournament participants")


class Fixture(models.Model):
    level = models.TextField()
    level_number = models.IntegerField(null=True)
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE)
    root = models.ForeignKey(
        "self", on_delete=models.PROTECT, null=True, related_name="children", blank=True
    )
    finished = models.BooleanField(default=False)
    # a fixture can have no more than one root, the root is the fixture that is dependent on the results of this one and another fixture
    # a fixture can be the root of no more than 2 other fixtures

    class Meta:
        ordering = ["-level_number", "tournament"]
        verbose_name = _("Fixture")
        verbose_name_plural = _("Fixtures")

    def number_of_players(self):
        count = self.playerfixture_set.count()
        return 0 if not count else count

    def __str__(self) -> str:
        return f"{self.level} - {self.level_number}"

    def clean(self) -> None:
        if self.children.count() > 2:
            raise ValidationError(
                _("A fixture cannot be dependent on more than 2 other fixtures")
            )
        if self.root and not a_if_and_only_if_b(
            not self.tournament, not self.root.tournament
        ):  # if root has no tournament, fixture should have no tournament either
            raise ValidationError(
                _(
                    "Either both the parent and child fixtures are in tournaments or neither of them are"
                )
            )
        if (
            self.root
            and self.tournament
            and not a_if_and_only_if_b(
                self.tournament and self.root.tournament,
                self.root.tournament == self.tournament,
            )
        ):
            raise ValidationError(
                _("This fixture hs to be in the same tournament as its parent")
            )
        if self.root and self.root.children.count() > 2:
            raise ValidationError(
                _(
                    "The fixture you are specifying is already dependent on 2 other fixtures"
                )
            )
        if (
            self.tournament
            and self.children.filter(tournament=self.tournament).count()
            != self.children.count()
        ):
            raise ValidationError(
                _(
                    "A fixture cannot be dependent on fixtures that are in another tournament or not in a tournament at all"
                )
            )
        if self.children and self.children.count() > 2:
            raise ValidationError(_("A fixture should have at most 2 children"))
        if self.tournament.fixture_set.count() > self.tournament.number_of_fixtures():
            raise ValidationError(
                _(
                    "You are trying to add this fixture to a tournament that already has its total number of fixtures"
                )
            )
        if self.winner and not self.winner.playerfixture_set.filter(fixture=self):
            raise ValidationError(
                _(
                    "A fixture's winner must be a player that is participating in that fixture"
                )
            )
            pass

    @property
    def get_winner(self):
        query = self.playerfixture_set.filter(is_winner=True)
        if query.count() > 0:
            return query.first()

        points_annotation = self.playerfixture_set.annotate(
            points=Sum("playerfixturegame__score")
        )

        if len(points_annotation) == 2:
            if points_annotation[0].points == points_annotation[1].points:
                return None
            else:
                return (
                    points_annotation[0]
                    if points_annotation[0].points > points_annotation[1].points
                    else points_annotation[1]
                )
        elif len(points_annotation) == 1:
            return points_annotation.first()

        return None

    def get_points_annotation(self):
        return self.playerfixture_set.annotate(points=Sum("playerfixturegame__score"))

    @property
    def get_winner_id(self):
        winner = self.get_winner

        return winner.id if winner else None

    def finish(self):
        winner = self.get_winner

        if winner:
            winner.is_winner = True
            winner.save()
            loser = self.playerfixture_set.filter(~Q(id=winner.id)).first()
            loser.player.kicked_out = True
            loser.player.save()

            if (
                self.root
                and self.root.playerfixture_set.filter(player=winner.player).count() < 1
            ):
                PlayerFixture.objects.create(
                    player=winner.player, fixture=Fixture.objects.get(id=self.root.id)
                )


def terminate_fixture(sender, instance: Fixture, **kwargs):
    # if fixture is finished kick out the losing player and create a new PlayerFixture for the winning player in this fixture's root fixture
    if instance.finished and instance.get_winner:
        instance.finish()


post_save.connect(terminate_fixture, Fixture)


class PlayerFixture(models.Model):
    COLOR_CHOICES = (("White", _("White")), ("Black", _("Black")))
    player = models.ForeignKey(TournamentPlayer, on_delete=models.CASCADE)
    fixture = models.ForeignKey(Fixture, on_delete=models.CASCADE)
    is_winner = models.BooleanField(default=False)

    def clean(self) -> None:
        ic(self)
        # a fixture cannot have more than 2 player fixture entries
        if self.fixture.playerfixture_set.all().count() > 2:
            raise ValidationError(_("Fixture already has two players"))

        # two playerfixtures in the same fixture cannot have is_winner set to True
        if self.fixture.playerfixture_set.filter(is_winner=True).count() >= 2:
            raise ValidationError(_("A fixture can only have one winner"))

        # a fixture in a tournament can only be played by players that have joined that tournament
        tournament = self.fixture.tournament

        if tournament and self.player.tournament != tournament:
            raise ValidationError(
                _(
                    "This fixture can only be played by players that are participating in the tournament"
                )
            )

        return super().clean()

    class Meta:
        unique_together = [["player", "fixture"]]
        verbose_name = _("Fixture player")
        verbose_name_plural = _("Fixture players")


class Game(models.Model):
    PERIOD_CHOICES = (("break", _("Break")), ("after_school", _("After school")))
    fixture = models.ForeignKey(Fixture, on_delete=models.CASCADE)
    classroom = models.CharField(max_length=5)
    time = models.DateTimeField(null=True)
    minutes_per_player = models.IntegerField()

    class Meta:
        unique_together = [
            ["fixture", "time"]
        ]  # games in the same fixture cannot be played at the same time
        ordering = ["time"]
        verbose_name = _("Game")
        verbose_name_plural = _("Games")

    def clean(self) -> None:
        # white score must either be 0, 0.5 or 1
        if self.white_score != 0 and self.white_score != 0.5 and self.white_score != 1:
            raise ValidationError(_("White score must either be 0, 0.5 or 1"))
        flag = False
        # checking if the period is in the period_choices
        for period in self.PERIOD_CHOICES:
            if self.period == period[0]:
                flag = True

        if flag == False:
            raise ValidationError(
                _("The period of the game must either be break or after school")
            )

        if self.number < 1:
            raise ValidationError(_("The game number must be a positive integer"))

        if self.fixture.children_set.filter(~Q(game__date__lte=self.date)):
            pass

    # a game cannot have a time_to_play less than that of the games in the predecessors of its fixture i.e.


class PlayerFixtureGame(models.Model):
    game = models.ForeignKey(Game, on_delete=models.CASCADE)
    playerfixture = models.ForeignKey(PlayerFixture, on_delete=models.CASCADE)
    score = models.FloatField(null=False, default=0.5)
    is_home = models.BooleanField(default=False)

    class Meta:
        unique_together = [["game", "playerfixture"]]
        verbose_name = _("Fixture game result")
        verbose_name_plural = _("Fixture game results")

    def clean(self) -> None:
        # a game can have only two playerfixturegame records
        if self.game.playerfixturegame_set.count() > 2:
            raise ValidationError(_("A game can have only 2 playerfixturegame records"))
        if self.game.playerfixturegame_set.filter(is_home=self.is_home).count() > 1:
            raise ValidationError(
                _(
                    "More than two players with the same color, change this instance's is_home value"
                )
            )
