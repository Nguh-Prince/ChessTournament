# Generated by Django 4.0.1 on 2022-03-08 07:49

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0032_alter_fixture_options_alter_game_options_and_more'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='fixture',
            options={'ordering': ['-level_number', 'tournament']},
        ),
        migrations.AlterModelOptions(
            name='game',
            options={'ordering': ['time']},
        ),
        migrations.AlterModelOptions(
            name='player',
            options={},
        ),
        migrations.AlterModelOptions(
            name='playerfixture',
            options={},
        ),
        migrations.AlterModelOptions(
            name='tournament',
            options={},
        ),
        migrations.AlterModelOptions(
            name='tournamentcategory',
            options={},
        ),
        migrations.AlterModelOptions(
            name='tournamentplayer',
            options={},
        ),
        migrations.AddField(
            model_name='player',
            name='email',
            field=models.EmailField(blank=True, max_length=254, null=True),
        ),
    ]
