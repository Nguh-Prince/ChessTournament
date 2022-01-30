from django.forms import ValidationError
from . import models
from .utilities import is_power_of_2

from django.utils.translation import gettext as _

from rest_framework import serializers
from rest_framework import status

class PlayerSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Player
        fields = "__all__"

class TournamentSerializer(serializers.ModelSerializer):
    participants_enrolled = serializers.IntegerField(source='tournamentplayer_set.count', 
    read_only=True)
    creator = PlayerSerializer(read_only=True)
    class Meta:
        model = models.Tournament
        fields = ('name', 'total_number_of_participants', 'participants_enrolled', 'creator')
    
    def validate_total_number_of_participants(self, value):
        if value <= 1:
            raise serializers.ValidationError( _("The total number of participants must be greater than 1") )
        if not is_power_of_2(value):
            raise serializers.ValidationError( _("The total number of participants must be a power of 2 i.e 2, 4, 8, 16, 32, etc.") )
    
    def validate_name(self, value):
        if self.Meta.model.objects.filter(name=value, completed=False).count() > 1:
            raise ValidationError( _("There is another active tournament with the same name") )

    def create(self, validated_data):

        return super().create(validated_data)

class FixtureSerializer(serializers.ModelSerializer):
    pass

class GameSerializer(serializers.ModelSerializer):
    pass