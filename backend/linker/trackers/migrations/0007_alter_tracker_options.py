# Generated by Django 5.2.3 on 2025-06-30 15:45

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('trackers', '0006_trackerlog_source_alter_trackerlog_tracker_type'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='tracker',
            options={'permissions': [('view_heatmap', 'Can view heatmap')]},
        ),
    ]
