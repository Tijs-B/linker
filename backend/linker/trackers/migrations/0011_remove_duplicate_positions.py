from django.db import migrations


def remove_duplicate_positions(apps, schema_editor):
    # Keep only the lowest pk per (timestamp, source, team_id, organization_member_id) group.
    schema_editor.execute("""
        DELETE FROM trackers_position
        WHERE id NOT IN (
            SELECT MIN(id)
            FROM trackers_position
            GROUP BY timestamp, source, team_id, organization_member_id
        )
    """)


class Migration(migrations.Migration):

    dependencies = [
        ('trackers', '0010_tracker_tracker_barcode'),
    ]

    operations = [
        migrations.RunPython(remove_duplicate_positions, migrations.RunPython.noop),
    ]
