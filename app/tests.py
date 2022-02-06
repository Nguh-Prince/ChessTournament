from typing import Iterable
from django.forms import model_to_dict
from . import models
from . import serializers
from .utilities import is_power_of_2

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
        
        player = models.Player.objects.create(first_name=first_name, last_name=last_name, phone=phone_number, classroom=classroom, level=level, gender=gender)

        return player

    def create_fixture(self, tournament:models.Tournament=None, root:models.Fixture=None, children:Iterable=None) -> models.Fixture:
        level = random.choice([1, 2, 3, 4, 5])

        fixture = models.Fixture.objects.create(level=level)

        if tournament:
            fixture.tournament = tournament
        if root:
            fixture.root = root
        if children:
            for child in children:
                child.root = fixture
                child.save()
        
        fixture.save()
        return fixture

    def create_fixture_in_tournament(self, tournament: models.Tournament) -> models.Fixture:
        fixture = self.create_fixture()
        fixture.tournament = tournament
        fixture.save()

        return fixture

    def create_tournament(self, creator: models.Player, name: str=None, total_number_of_participants: int=None) -> models.Tournament:
        if name is None:
            name = random.choice(first_names)
        if total_number_of_participants is None:
            total_number_of_participants = random.choice( [2, 4, 8] )
        
        tournament = models.Tournament.objects.create(creator=creator, name=name, total_number_of_participants=total_number_of_participants)

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
        print(fixture)

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

    def test_fixture_with_players_that_are_not_in_childrens_fixtureplayer_set(self):
        pass
    # players must be from the fixture's children's fixtureplayer_set

    def test_fixture_with_more_than_2_children(self):
        """
        fixture_with_more_than_2_children should raise a ValidationError
        """
        player = self.model_creation.create_random_player()
        tournament = self.model_creation.create_tournament(player, name="Test")

        children = [self.model_creation.create_fixture(tournament=tournament), self.model_creation.create_fixture(tournament=tournament), self.model_creation.create_fixture(tournament=tournament)]
        parent_fixture = self.model_creation.create_fixture(tournament=tournament, children=children)
        self.assertRaises(ValidationError, parent_fixture.clean)

    def test_fixture_in_different_tournament_from_children(self):
        """
        fixture_in_different_tournament_from_children should raise a ValidationError
        """
        player = self.model_creation.create_random_player()

        tournaments = [self.model_creation.create_tournament(player, "Test Tournament 0"), self.model_creation.create_tournament(player, "Test Tournament 1")]

        root_fixture = self.model_creation.create_fixture(tournament=tournaments[0])

        for i in range(2):
            self.model_creation.create_fixture(tournament=tournaments[1], root=root_fixture)

        self.assertRaises(ValidationError, root_fixture.clean)

    def test_fixture_in_tournament_with_adequate_number_of_fixtures(self):
        """
        fixture_in_tournament_with_adequate_number_of_fixtures should raise a ValidationError
        """
        player = self.model_creation.create_random_player()

        tournament = self.model_creation.create_tournament(creator=player, total_number_of_participants=8)

        for i in range( int(tournament.number_of_fixtures()) ):
            fixture = self.model_creation.create_fixture(tournament=tournament)

        fixture = self.model_creation.create_fixture(tournament=tournament)

        self.assertRaises(ValidationError, fixture.clean)

class TournamentTest(TestCase):
    model_creation = ModelCreation()

    def test_tournament_with_odd_number_of_participants(self):
        """
        tournament_with_odd_number_of_participants should raise a ValidationError when a tournament has an odd total_number_of_participants
        """
        almighty_creator = self.model_creation.create_random_player()
        tournament = self.model_creation.create_tournament(creator=almighty_creator)
        tournament.total_number_of_participants = random.choice( range(1, 100, 2) )

        self.assertRaises(ValidationError, tournament.clean)

    def test_tournament_with_non_power_of_2_participants(self):
        """
        tournament_with_non_power_of_2_participants should raise a ValidationError when a tournament has an even but non power of 2 total_number_of_participants
        """
        almighty_creator = self.model_creation.create_random_player()
        tournament = self.model_creation.create_tournament(creator=almighty_creator)
        tournament.total_number_of_participants = random.choice( [f for f in range(2, 100, 2) if not is_power_of_2(f) ] )

        self.assertRaises(ValidationError, tournament.clean)

    def test_tournament_with_power_of_2_total_number_of_participants(self):
        """
        tournament_with_non_power_of_2_participants shouldn't raise a ValidationError when a tournament has a power of 2 total_number_of_participants
        """
        almighty_creator = self.model_creation.create_random_player()
        tournament = self.model_creation.create_tournament(creator=almighty_creator)
        tournament.total_number_of_participants = random.choice( [f for f in range(2, 100, 2) if is_power_of_2(f) ] )

        self.assertIsNone(tournament.clean())

    def test_tournament_with_1_participant(self):
        """
        tournament_with_1_participant should raise a ValidationError
        """
        almighty_creator = self.model_creation.create_random_player()
        tournament = self.model_creation.create_tournament(creator=almighty_creator)
        tournament.total_number_of_participants = 1

        self.assertRaises(ValidationError, tournament.clean)

    def test_tournament_with_negative_participants(self):
        """
        tournament_with_negative_participants should raise a ValidationError
        """
        almighty_creator = self.model_creation.create_random_player()
        tournament = self.model_creation.create_tournament(creator=almighty_creator)
        tournament.total_number_of_participants = -8

        self.assertRaises(ValidationError, tournament.clean)

    def test_two_uncompleted_tournaments_with_same_names(self):
        """
        two_uncompleted_tournaments_with_same_names should raise a ValidationError
        """
        almighty_creator = self.model_creation.create_random_player()
        tournament1 = self.model_creation.create_tournament(almighty_creator, "tournoi")
        tournament2 = self.model_creation.create_tournament(almighty_creator, "tournoi")

        self.assertRaises(ValidationError, tournament2.clean)

class FixtureTest(TestCase):
    pass