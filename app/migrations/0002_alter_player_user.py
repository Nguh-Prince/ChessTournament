# Generated by Django 4.0 on 2022-01-23 14:45

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("auth", "0012_alter_user_first_name_max_length"),
        ("app", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="player",
            name="user",
            field=models.OneToOneField(
                null=True, on_delete=django.db.models.deletion.CASCADE, to="auth.user"
            ),
        ),
    ]
