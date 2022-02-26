# Generated by Django 4.0 on 2022-01-23 14:44

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("auth", "0012_alter_user_first_name_max_length"),
    ]

    operations = [
        migrations.CreateModel(
            name="Fixture",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("level", models.IntegerField()),
            ],
        ),
        migrations.CreateModel(
            name="Player",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("first_name", models.CharField(max_length=30)),
                ("last_name", models.CharField(max_length=30)),
                ("phone", models.CharField(max_length=20, unique=True)),
                ("level", models.IntegerField()),
                ("classroom", models.CharField(max_length=5)),
                (
                    "gender",
                    models.CharField(
                        choices=[
                            ("m", "Male"),
                            ("f", "Female"),
                            ("nb", "Non binary"),
                            ("rns", "Rather not say"),
                        ],
                        max_length=3,
                    ),
                ),
                (
                    "user",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE, to="auth.user"
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="Game",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("date", models.DateField()),
                ("classroom", models.CharField(max_length=5)),
                ("period", models.CharField(max_length=30)),
                ("number", models.IntegerField(default=1)),
                ("white_score", models.FloatField()),
                (
                    "fixture",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, to="app.fixture"
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="PlayerFixture",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("color", models.CharField(choices=[], max_length=6)),
                (
                    "fixture",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, to="app.fixture"
                    ),
                ),
                (
                    "player",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, to="app.player"
                    ),
                ),
            ],
            options={
                "unique_together": {("player", "fixture")},
            },
        ),
    ]
