# Generated by Django 4.0.1 on 2022-02-25 11:27

import app.models
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("app", "0030_tournamentcategory_player_image_tournament_image_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="tournament",
            name="image",
            field=models.ImageField(upload_to=app.models.tournament_directory_path),
        ),
    ]
