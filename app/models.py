from .utilities import is_power_of_2

from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _

class Player(models.Model):
    GENDER_CHOICES = (
        ("m", _("Male")),
        ("f", _("Female")),
        ("nb", _("Non binary")),
        ("rns", _("Rather not say"))
    )
    first_name = models.CharField(max_length=30, null=False)
    last_name = models.CharField(max_length=30, null=False)
    phone = models.CharField(max_length=20, unique=True)
    level = models.IntegerField(null=True)
    classroom = models.CharField(max_length=5, null=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True)
    gender = models.CharField(max_length=3, choices=GENDER_CHOICES)

class Tournament(models.Model):
    time_created = models.DateTimeField(auto_now_add=True)
    creator = models.ForeignKey(Player, on_delete=models.CASCADE)
    total_number_of_participants = models.IntegerField(default=16)
    
    def clean(self) -> None:
        # a tournament must have a total_number_participants that is a power of 2, i.e. 2, 4, 8, 16 and greater than 1 etc.
        if self.total_number_of_participants <= 1:
            raise ValidationError( _("The total number of participants must be greater than 1") )
        if not is_power_of_2(self.total_number_of_participants):
            raise ValidationError( _("The total number of participants must be a power of 2 i.e 2, 4, 8, 16, 32, etc.") )
        return super().clean()

class TournamentCompetitors(models.Model):
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE)
    player = models.ForeignKey(Player, on_delete=models.CASCADE)

class Fixture(models.Model):
    level = models.IntegerField()
    tournament = models.ForeignKey(Tournament, on_delete=models.SET_NULL, null=True)

class PlayerFixture(models.Model):
    COLOR_CHOICES = (
        ("White", _("White")),
        ("Black", _("Black"))
    )
    player = models.ForeignKey(Player, on_delete=models.CASCADE)
    fixture = models.ForeignKey(Fixture, on_delete=models.CASCADE)
    color = models.CharField(max_length=6, choices=())

    def clean(self) -> None:
        # a fixture cannot have more than 2 player fixture entries
        if self.fixture.playerfixture_set.all().count() > 2:
            raise ValidationError( _("Fixture already has two players") )
        # a fixture in a tournament can only be played by players that have joined that tournament
        tournament = self.fixture.tournament

        if tournament and self.player.tournamentcompetitors_set.filter(tournament=tournament).count() < 1:
            raise ValidationError( _("This fixture can only be played by players that are participating in the tournament") )
        return super().clean()

    class Meta:
        unique_together = [ ["player", "fixture"] ]

class Game(models.Model):
    PERIOD_CHOICES = (
        ("break", _("Break")),
        ("after_school", _("After school"))
    )
    fixture = models.ForeignKey(Fixture, on_delete=models.CASCADE)
    date = models.DateField()
    classroom = models.CharField(max_length=5)
    period = models.CharField(max_length=30)
    number = models.IntegerField(default=1)
    white_score = models.FloatField()

    def clean(self) -> None:
        # white score must either be 0, 0.5 or 1
        if self.white_score != 0 and self.white_score != 0.5 and self.white_score != 1:
            raise ValidationError( _("White score must either be 0, 0.5 or 1") )
        flag = False
        # checking if the period is in the period_choices
        for period in self.PERIOD_CHOICES:
            if self.period == period[0]:
                flag = True