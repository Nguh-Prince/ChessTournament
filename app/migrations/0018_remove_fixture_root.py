# Generated by Django 4.0.1 on 2022-02-06 13:43

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0017_alter_game_away_alter_game_home'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='fixture',
            name='root',
        ),
    ]
