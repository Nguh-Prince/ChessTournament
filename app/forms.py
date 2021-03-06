from django import forms
from django.utils.translation import gettext as _

from . import models


class GameForm(forms.ModelForm):
    class Meta:
        model = models.Game
        fields = ("time", "classroom")

class PlayerForm(forms.ModelForm):
    class Meta:
        model = models.Player
        exclude = ['first_name', 'last_name']