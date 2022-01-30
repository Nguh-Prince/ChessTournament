from . import models, serializers

from rest_framework.generics import ListCreateAPIView

class TournamentsList(ListCreateAPIView):
    queryset = models.Tournament.objects.all()

    serializer_class = serializers.TournamentSerializer
    