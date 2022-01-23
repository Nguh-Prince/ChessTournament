from django.db import models
from django.contrib.auth.models import User

class Player(models.Model):
    first_name = models.CharField(max_length=30, null=False)
    last_name = models.CharField(max_length=30, null=False)
    phone = models.CharField(max_length=20, unique=True)
    level = models.IntegerField()
    classroom = models.CharField(max_length=5)
    user = models.OneToOneField(User, on_delete=models.CASCADE)

class Fixture(models.Model):
    level = models.IntegerField()

class PlayerFixture(models.Model):
    player = models.ForeignKey(Player, on_delete=models.CASCADE)
    fixture = models.ForeignKey(Fixture, on_delete=models.CASCADE)

class Game(models.Model):
    fixture = models.ForeignKey(Fixture, on_delete=models.CASCADE)
    date = models.DateField()
    classroom = models.CharField(max_length=5)
    period = models.CharField(max_length=30)
    number = models.IntegerField()