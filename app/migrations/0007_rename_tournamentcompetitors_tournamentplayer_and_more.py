# Generated by Django 4.0.1 on 2022-01-30 05:36

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("app", "0006_alter_tournament_total_number_of_participants"),
    ]

    operations = [
        migrations.RenameModel(
            old_name="TournamentCompetitors",
            new_name="TournamentPlayer",
        ),
        migrations.AddField(
            model_name="tournament",
            name="completed",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="tournament",
            name="name",
            field=models.CharField(default="Springles", max_length=150),
            preserve_default=False,
        ),
    ]
