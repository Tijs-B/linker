# Generated by Django 5.1.6 on 2025-04-25 13:39

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('map', '0009_tocht_is_alternative_alter_tocht_identifier_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='forbiddenarea',
            name='route_allowed',
            field=models.BooleanField(default=False),
        ),
    ]
