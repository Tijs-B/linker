# Generated by Django 5.0.1 on 2024-04-24 20:06

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('trackers', '0004_rename_tracker_code_tracker_tracker_name'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='trackerlog',
            unique_together={('tracker', 'gps_datetime', 'tracker_type')},
        ),
        migrations.AlterField(
            model_name='trackerlog',
            name='fetch_datetime',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='trackerlog',
            name='tracker_type',
            field=models.IntegerField(db_index=True, default=1),
            preserve_default=False,
        ),
        migrations.AddIndex(
            model_name='trackerlog',
            index=models.Index(fields=['tracker', 'tracker_type'], name='trackers_tr_tracker_245074_idx'),
        ),
        migrations.RemoveField(
            model_name='trackerlog',
            name='code',
        ),
        migrations.RemoveField(
            model_name='trackerlog',
            name='input_acc',
        ),
        migrations.RemoveField(
            model_name='trackerlog',
            name='is_online',
        ),
        migrations.RemoveField(
            model_name='trackerlog',
            name='is_online_threshold',
        ),
        migrations.RemoveField(
            model_name='trackerlog',
            name='name',
        ),
        migrations.RemoveField(
            model_name='trackerlog',
            name='voltage',
        ),
    ]