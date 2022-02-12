from . import models, permissions, serializers

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

class TournamentDetail(generics.RetrieveUpdateDestroyAPIView):
    def get_queryset(self):
        return models.Tournament.objects.all()
    
    serializer_class = serializers.TournamentDetailSerializer
    permission_classes = (permissions.IsCreatorOr403, )

class TournamentPlayerDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = models.TournamentPlayer.objects.all()

    serializer_class = serializers.TournamentPlayerSerializer
    permission_classes = (permissions.IsTournamentCreatorOrPlayerOrReadOnly, )

class EnrollPlayerSerializer(generics.CreateAPIView):
    serializer_class = serializers.TournamentEnrollSerializer

class TournamentGames(generics.ListCreateAPIView):
    def get_queryset(self):
        return models.Game.objects.filter( fixture__tournament__id=self.kwargs["tournament_id"] )

    serializer_class = serializers.GameSerializer
    permission_classes = (permissions.IsTournamentCreatororReadOnly, )

class FixtureDetail(generics.RetrieveUpdateAPIView):
    queryset = models.Fixture.objects.all()

    serializer_class = serializers.FixtureSerializer
    # permission_classes = (permissions.IsTournamentCreatororReadOnly, )

class GameDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = models.Game.objects.all()

    serializer_class = serializers.GameSerializer
    permission_classes = (permissions.IsTournamentCreatororReadOnly, )
