# Generated by Django 4.0.1 on 2022-02-05 03:58

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("app", "0014_alter_game_white_score_alter_game_unique_together"),
    ]

    operations = [
        migrations.AddField(
            model_name="game",
            name="away",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="away",
                to="app.playerfixture",
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="game",
            name="home",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="home",
                to="app.playerfixture",
            ),
            preserve_default=False,
        ),
    ]
