# Generated by Django 4.0.1 on 2022-01-29 17:04

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0004_tournament_tournamentcompetitors_fixture_tournament'),
    ]

    operations = [
        migrations.AddField(
            model_name='tournament',
            name='total_number_of_participants',
            field=models.IntegerField(default=8),
            preserve_default=False,
        ),
    ]