from . import models, serializers

from django.db.models import Q

from rest_framework import generics

class PlayersList(generics.ListCreateAPIView):
    queryset = models.Player.objects.all()

    serializer_class = serializers.PlayerSerializer

class TournamentsList(generics.ListCreateAPIView):
    # get a list of tournaments or add a tournament
    queryset = models.Tournament.objects.all()

    serializer_class = serializers.TournamentSerializer

class PlayerTournamentsList(generics.ListAPIView):
    # get a list of tournaments that a certain player either created or is participating in
    def get_queryset(self):
        return models.Tournament.objects.filter( Q(creator__id=self.kwargs['player_id']) | Q(tournamentplayer__id=self.kwargs['player_id']) ).distinct()

    serializer_class = serializers.TournamentSerializer

class EnrollPlayerSerializer(generics.CreateAPIView):
    serializer_class = serializers.TournamentEnrollSerializer