from . import models

from django import forms
from django.utils.translation import gettext as _

class GameForm(forms.ModelForm):
    class Meta:
        model = models.Game
        fields = ('classroom', 'date', 'period', 'number')