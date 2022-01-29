from . import models

from rest_framework import serializers

class TournamentSerializer(serializers.ModelSerializer):
    pass

class PlayerSerializer(serializers.ModelSerializer):
    pass

class FixtureSerializer(serializers.ModelSerializer):
    pass

class GameSerializer(serializers.ModelSerializer):
    pass