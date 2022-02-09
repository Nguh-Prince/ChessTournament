# Generated by Django 4.0.1 on 2022-02-09 18:34

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0019_fixture_root'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='game',
            unique_together=set(),
        ),
        migrations.AddField(
            model_name='game',
            name='time',
            field=models.DateTimeField(null=True),
        ),
        migrations.RemoveField(
            model_name='game',
            name='away',
        ),
        migrations.RemoveField(
            model_name='game',
            name='away_score',
        ),
        migrations.RemoveField(
            model_name='game',
            name='date',
        ),
        migrations.RemoveField(
            model_name='game',
            name='home',
        ),
        migrations.RemoveField(
            model_name='game',
            name='home_score',
        ),
        migrations.RemoveField(
            model_name='game',
            name='number',
        ),
        migrations.RemoveField(
            model_name='game',
            name='period',
        ),
        migrations.CreateModel(
            name='PlayerFixtureGame',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('score', models.FloatField(default=0.5)),
                ('is_home', models.BooleanField(default=False)),
                ('game', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='app.game')),
                ('playerfixture', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='app.playerfixture')),
            ],
            options={
                'unique_together': {('game', 'playerfixture')},
            },
        ),
    ]
