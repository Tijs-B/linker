# Generated by Django 5.0.1 on 2024-04-17 13:47

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('people', '0004_alter_team_group_picture'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='team',
            options={'permissions': [('can_upload_picture', 'Can upload a group picture')]},
        ),
    ]
