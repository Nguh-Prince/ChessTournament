from . import models

from django.core.exceptions import ValidationError
from django.test import TestCase

import random

first_names = ["John", "Chris", "Michael", "Peter",
               "Andrew", "Kizito", "Randy", "Jake", "Daniel"]
last_names = ["Radcliffe", "Specter", "Stone", "Hightower",
              "Lisbon", "Peterson", "Anderson", "Powers"]
phone_numbers = ["6535040440703", "6749940201814", "6747920592203",
                 "65452io2ou48058", "68084924533203", "678342258599286"]
genders = ["m", "f", "nb", "rns"]

class ModelCreation:
    def create_random_player(self) -> models.Player:
        gender = random.choice(genders)
        first_name = random.choice(first_names)
        last_name = random.choice(last_names)
        
        # get a unique phone number
        while True:
            phone_number = random.choice(phone_numbers)
            if models.Player.objects.filter(phone=phone_number).count() < 1:
                break

        classroom = "se3"
        level = 3
        
        return models.Player.objects.create(first_name=first_name, last_name=last_name, phone=phone_number, classroom=classroom, level=level, gender=gender)

    def create_fixture(self) -> models.Fixture:
        level = random.choice([1, 2, 3, 4, 5])

        return models.Fixture.objects.create(level=level)

    def create_fixture_in_tournament(self, tournament: models.Tournament) -> models.Fixture:
        fixture = self.create_fixture()
        fixture.tournament = tournament
        fixture.save()

        return fixture

    def create_tournament(self, creator: models.Player) -> models.Tournament:
        tournament = models.Tournament.objects.create(creator=creator)

        return tournament

class PlayerFixtureTest(TestCase):
    model_creation = ModelCreation()

    def test_fixture_with_more_than_two_playerfixture_entries(self):
        """
        fixture_with_more_than_two_playerfixture_entries should raise a ValidationError if the fixture has more than 2 playerfixture entries
        """
        player1 = self.model_creation.create_random_player()
        player2 = self.model_creation.create_random_player()
        player3 = self.model_creation.create_random_player()
        fixture = self.model_creation.create_fixture()

        for player in [player1, player2, player3]:
            playerfixture = models.PlayerFixture.objects.create(player=player, fixture=fixture)

        self.assertRaises(ValidationError, playerfixture.clean)
    
    def test_fixture_with_two_playerfixture_entries(self):
        """
        fixture_with_two_playerfixture_entries shouldn't raise a ValidationError if the fixture has exactly 2 playerfixture entries
        """
        player1 = self.model_creation.create_random_player()
        player2 = self.model_creation.create_random_player()
        fixture = self.model_creation.create_fixture()

        for player in [player1, player2]:
            playerfixture = models.PlayerFixture.objects.create(player=player, fixture=fixture)

        clean_result = playerfixture.clean()
        self.assertIsNone(clean_result)
    
    def test_fixture_with_non_tournament_players(self):
        """
        fixture_with_non_tournament_players raises a ValidationError if a player that is not part of a fixture's tournament tries to play that fixture
        """
        player = self.model_creation.create_random_player()

        tournament = self.model_creation.create_tournament(creator=player)
        fixture = self.model_creation.create_fixture_in_tournament(tournament=tournament)

        playerfixture = models.PlayerFixture.objects.create(player=player, fixture=fixture)
        self.assertRaises(ValidationError, playerfixture.clean)