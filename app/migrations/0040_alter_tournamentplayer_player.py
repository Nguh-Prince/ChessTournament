# Generated by Django 4.0.1 on 2022-04-01 11:01

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0039_fixture_level_en_fixture_level_fr_tournament_name_en_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='tournamentplayer',
            name='player',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to='app.player'),
        ),
    ]