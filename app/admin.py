from . import models

from django.contrib import admin

admin.site.register(models.Player)
admin.site.register(models.Tournament)
admin.site.register(models.TournamentPlayer)
admin.site.register(models.TournamentCategory)
admin.site.register(models.Fixture)
