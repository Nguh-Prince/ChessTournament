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

class TournamentPlayerSerializer(serializers.ModelSerializer):
    player = PlayerSerializer(read_only=True)

    class Meta:
        model = models.TournamentPlayer
        fields = ('id', 'player', 'tournament', 'player', 'participating', 'kicked_out')

    def validate(self, attrs):
        if attrs['participating'] and attrs['kicked_out'] and attrs['participating'] != attrs['kicked_out'] and attrs['participating'] == False:  # cannot be kicked out of a tournament you're not participating in
            raise ValidationError( _("Player cannot be kicked out of a tournament they are not participating in") )
        return super().validate(attrs)

class TournamentSerializer(serializers.ModelSerializer):
    participants_enrolled = serializers.IntegerField(source='enrolled_participants.count', 
    read_only=True)
    creator_details = PlayerSerializer(read_only=True, source='creator')
    participants = TournamentPlayerSerializer(read_only=True, source='tournamentplayer_set', many=True)

    class Meta:
        model = models.Tournament
        fields = ('id', 'name', 'total_number_of_participants', 'participants_enrolled', 'creator', 'creator_details', 'time_created', 'participants')
    
    def validate_total_number_of_participants(self, value):
        # must be a power of 2 and greater than 1
        if value <= 1:
            raise serializers.ValidationError( _("The total number of participants must be greater than 1") )
        if not is_power_of_2(value):
            raise serializers.ValidationError( _("The total number of participants must be a power of 2 i.e 2, 4, 8, 16, 32, etc.") )

        return value
    
    def validate_name(self, value):
        # two non-completed tournaments cannot have the same name
        if self.Meta.model.objects.filter(name=value, completed=False).count() > 1:
            raise ValidationError( _("There is another active tournament with the same name") )
        
        return value

class TournamentDetailSerializer(TournamentSerializer):
    all_players_enrolled = TournamentPlayerSerializer(read_only=True, source='tournamentplayer_set', many=True)
    # total_number_of_players_applied = serializers.IntegerField(source='tournamentplayer_set.count', read_only=True)
    class Meta:
        model = models.Tournament
        fields = ('id', 'name', 'total_number_of_participants', 'participants_enrolled', 'creator', 'creator_details', 'time_created', 'participants', 'all_players_enrolled', )

class TournamentEnrollSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.TournamentPlayer
        fields = ('player', 'tournament', )

class FixtureSerializer(serializers.ModelSerializer):
    pass

class GameSerializer(serializers.ModelSerializer):
    pass