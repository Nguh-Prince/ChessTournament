from . import models
from .utilities import is_power_of_2

from django.utils.translation import gettext as _

from icecream import ic

from rest_framework import serializers
from rest_framework.serializers import ValidationError

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

class PlayerFixtureGameSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.PlayerFixtureGame
        fields = ('id', 'playerfixture', 'score', 'is_home')

class GameSerializer(serializers.ModelSerializer):
    players = PlayerFixtureGameSerializer(many=True, source='playerfixturegame_set')
    class Meta:
        model = models.Game
        fields = ('id', 'time', 'fixture', 'players', 'classroom', 'minutes_per_player', '__str__')

    def validate(self, attrs):
        ic(attrs)
        if attrs['fixture'].children.filter(game__time__gt=attrs['time']):
            raise serializers.ValidationError( _("This game must have a time greater than or equal to that of the games in the previous fixtures") )
        
        if len(attrs['playerfixturegame_set']) != 2 and len(attrs['playerfixturegame_set']) > 0:
            raise serializers.ValidationError( _("A game can only have 2 players") )

        if attrs['fixture'] and attrs['fixture'].children.filter(game__time__gte=attrs['time']):
            raise serializers.ValidationError( _("This game cannot be played before or at the same time as a game in a fixture preceding this game's fixture") )

        if attrs['fixture'] and attrs['fixture'].game_set.filter(time=attrs['time']):
            raise serializers.ValidationError( _("Another game is being played at the same time as this game") )

        home_count, away_count = 0, 0
        for player in attrs['playerfixturegame_set']:
            if attrs['fixture'] and player['playerfixture'].fixture != attrs['fixture']:
                raise serializers.ValidationError( _("This game can only be played by players in its fixture") )
            if player['is_home']:
                home_count += 1
            else: 
                away_count += 1

        ic(home_count, away_count, len( attrs['playerfixturegame_set'] ) > 0)
        if len(attrs['playerfixturegame_set']) > 0:
            if home_count != away_count and home_count != 1 and away_count != 1:
                raise serializers.ValidationError( _("There can only be one home and one away player") )
        
        return attrs

    def create(self, validated_data):
        ic(validated_data)
        game_players = validated_data.pop( 'playerfixturegame_set' )
        game = models.Game.objects.create( **validated_data )

        for player in game_players:
            models.PlayerFixtureGame.objects.create( **player, game=game )

        return game

    def update(self, instance, validated_data):
        
        pass

class FixtureSerializer(serializers.ModelSerializer):
    pass