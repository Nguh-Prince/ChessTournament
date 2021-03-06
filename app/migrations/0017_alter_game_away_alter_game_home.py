# Generated by Django 4.0.1 on 2022-02-05 04:07

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("app", "0016_rename_white_score_game_away_score_game_home_score_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="game",
            name="away",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="away",
                to="app.playerfixture",
            ),
        ),
        migrations.AlterField(
            model_name="game",
            name="home",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="home",
                to="app.playerfixture",
            ),
        ),
    ]
