# Generated by Django 5.0.1 on 2024-04-23 18:53

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('map', '0007_weide_identifier_weide_name_alter_weide_tocht'),
    ]

    operations = [
        migrations.AlterField(
            model_name='weide',
            name='tocht',
            field=models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='map.tocht'),
        ),
    ]