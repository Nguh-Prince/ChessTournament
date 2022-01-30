from . import models, serializers

from django.db.models import Q

from rest_framework import generics

class PlayersList(generics.ListCreateAPIView):
    queryset = models.Player.objects.all()

    serializer_class = serializers.PlayerSerializer

class TournamentsList(generics.ListCreateAPIView):
    queryset = models.Tournament.objects.all()

    serializer_class = serializers.TournamentSerializer

class PlayerTournamentsList(generics.ListAPIView):
    def get_queryset(self):
        return models.Tournament.objects.filter( Q(creator__id=self.kwargs['player_id']) | Q(tournamentplayer__id=self.kwargs['player_id']) )

    serializer_class = serializers.TournamentSerializer