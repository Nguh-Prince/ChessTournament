from .utilities import is_power_of_2

from django.db import models
from django.db.models.signals import post_save 
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _

import math

class Player(models.Model):
    GENDER_CHOICES = (
        ("m", _("Male")), 
        ("nb", _("Non binary")),
        ("rns", _("Rather not say"))
    )
    first_name = models.CharField(max_length=30, null=False)
    last_name = models.CharField(max_length=30, null=False)
    phone = models.CharField(max_length=20, unique=True)
    level = models.IntegerField(null=True, blank=True)
    classroom = models.CharField(max_length=5, null=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True)
    gender = models.CharField(max_length=3, choices=GENDER_CHOICES)

    def __str__(self) -> str:
        return f"{self.first_name} {self.last_name}: {self.classroom}"
    
    @property
    def name(self) -> str:
        return f"{self.first_name} {self.last_name}"

class GeometricProgression:
    def __init__(self, first_term: float, common_ratio: float) -> None:
        self.first_term = first_term
        self.common_ratio = common_ratio

    def nthTerm(self, n:int) -> float:
        return self.first_term * (self.common_ratio ** (n-1))

    def sumOfNTerms(self, n:int) -> float:
        if self.common_ratio < 1:
            numerator, denominator = 1 - (self.common_ratio ** n), 1 - self.common_ratio
        else:
            numerator, denominator = (self.common_ratio ** n) - 1, self.common_ratio - 1
        
        return ( self.first_term * numerator ) / denominator
    
    def getSequencePositionofNumber(self, number) -> int:
        """
        given a number, this method returns its position in the progression
        """
        n = math.log( (2*number/self.first_term*self.common_ratio), self.common_ratio )

        return n if n.is_integer() else None

class Tournament(models.Model):
    time_created = models.DateTimeField(auto_now_add=True)
    creator = models.ForeignKey(Player, on_delete=models.CASCADE)
    total_number_of_participants = models.IntegerField(default=16)
    completed = models.BooleanField(default=False)
    started = models.BooleanField(default=False)
    name = models.CharField(max_length=150)
    
    def clean(self) -> None:
        # a tournament must have a total_number_participants that is a power of 2, i.e. 2, 4, 8, 16 and greater than 1 etc.
        if self.total_number_of_participants <= 1:
            raise ValidationError( _("The total number of participants must be greater than 1") )
        if not is_power_of_2(self.total_number_of_participants):
            raise ValidationError( _("The total number of participants must be a power of 2 i.e 2, 4, 8, 16, 32, etc.") )

        # two uncompleted tournaments cannot have the same name
        if Tournament.objects.filter(name=self.name, completed=False).count() > 1:
            raise ValidationError( _("There is another active tournament with the same name") )
        return super().clean()

        # a tournament cannot be started when the number of enrolled participants is less than the total_number_of_participants
        # a tournament cannot be completed when it has not yet started
        # a tournament cannot be modified when it has started or is completed
    
    def number_of_fixtures(self):
        gp = GeometricProgression(self.total_number_of_participants // 2, 0.5)
        return gp.sumOfNTerms( gp.getSequencePositionofNumber(1) )
    
    def enrolled_participants(self):
        return self.tournamentplayer_set.filter(participating=True)
    
    def number_of_enrolled_participants(self):
        return self.enrolled_participants().count() if self.enrolled_participants() else 0

def create_tournament_fixtures(sender, instance: Tournament, **kwargs):
    # create fixtures for a tournament once the tournament has been added or edited
    if instance.clean():
        # delete all the other fixtures
        instance.fixture_set.all().delete()

        for i in range(instance.number_of_fixtures()):
            pass

class TournamentPlayer(models.Model):
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE)
    player = models.ForeignKey(Player, on_delete=models.CASCADE)
    kicked_out = models.BooleanField(default=False)
    participating = models.BooleanField(default=False) # when a player is accepted to compete in a tournament this becomes True

    def clean(self) -> None:
        # a tournamentcompetitor cannot be added to a tournament that already has its total_number_of_participants
        if self.tournament.tournamentplayer_set.filter(participating=True).count() > self.tournament.total_number_of_participants:
            raise ValidationError( _("The tournament is already full.") )

    class Meta:
        unique_together = [ ["tournament", "player"] ]

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

        if tournament and self.player.tournamentplayer_set.filter(tournament=tournament).count() < 1:
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