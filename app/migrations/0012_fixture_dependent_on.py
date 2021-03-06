# Generated by Django 4.0.1 on 2022-02-04 08:56

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("app", "0011_alter_fixture_options"),
    ]

    operations = [
        migrations.AddField(
            model_name="fixture",
            name="dependent_on",
            field=models.OneToOneField(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="parent_fixture",
                to="app.fixture",
            ),
        ),
    ]
