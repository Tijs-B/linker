from django.contrib.gis.db import models
from django.db.models import Q
from enumfields import EnumField

from .constants import PositionSource, TrackerLogSource


class Tracker(models.Model):
    tracker_id = models.CharField(max_length=50, db_index=True, unique=True)
    tracker_name = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        permissions = [
            ('view_heatmap', 'Can view heatmap'),
        ]

    def __str__(self) -> str:
        if self.tracker_name:
            return self.tracker_name
        else:
            return self.tracker_id


class TrackerLog(models.Model):
    tracker = models.ForeignKey(Tracker, on_delete=models.CASCADE, related_name='tracker_logs')
    gps_datetime = models.DateTimeField(db_index=True)
    point = models.PointField()

    team_is_safe = models.BooleanField(default=False)
    source = EnumField(TrackerLogSource, max_length=30)

    # The below fields are less important.
    tracker_type = models.IntegerField(db_index=True, blank=True, null=True)
    fetch_datetime = models.DateTimeField(blank=True, null=True)
    local_datetime = models.DateTimeField(blank=True, null=True)
    last_sync_date = models.DateTimeField(blank=True, null=True)
    satellites = models.IntegerField(blank=True, null=True)
    analog_input = models.FloatField(blank=True, null=True)
    heading = models.IntegerField(blank=True, null=True)
    speed = models.IntegerField(blank=True, null=True)
    has_gps = models.BooleanField(blank=True, null=True)
    has_power = models.BooleanField(blank=True, null=True)

    class Meta:
        unique_together = [['tracker', 'gps_datetime', 'tracker_type']]
        indexes = [models.Index(fields=('tracker', 'tracker_type'))]

    def __str__(self) -> str:
        return f'{self.tracker} {self.gps_datetime}'


class Position(models.Model):
    team = models.ForeignKey('people.Team', on_delete=models.CASCADE, null=True, blank=True, related_name='positions')
    organization_member = models.ForeignKey(
        'people.OrganizationMember', on_delete=models.CASCADE, null=True, blank=True, related_name='positions'
    )

    timestamp = models.DateTimeField()
    point = models.PointField()
    source = EnumField(PositionSource, max_length=30)

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=(
                    Q(team__isnull=False, organization_member__isnull=True)
                    | Q(team__isnull=True, organization_member__isnull=False)
                ),
                name='position_exactly_one_owner',
            )
        ]
        indexes = [
            models.Index(fields=['team', 'timestamp']),
            models.Index(fields=['organization_member', 'timestamp']),
        ]
