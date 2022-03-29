from modeltranslation.translator import TranslationOptions, translator

from .models import *

class TournamentTranslationOptions(TranslationOptions):
    fields = ("terms", "name")

class FixtureTranslationOptions(TranslationOptions):
    fields = ("level", )

translator.register(Tournament, TournamentTranslationOptions)
translator.register(Fixture, FixtureTranslationOptions)