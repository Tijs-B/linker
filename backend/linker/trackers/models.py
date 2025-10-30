from django.contrib.gis.db import models
from django.contrib.gis.geos import LineString
from django.contrib.gis.measure import D
from django.db import connection
from enumfields import EnumField

from linker.config.models import Switch
from linker.map.models import Basis, Tocht
from linker.tracing.constants import GEBIED_MAX_DISTANCE, SKIP_BASIS_DISTANCE
from linker.trackers.constants import SWITCH_EXCLUDE_BASIS_FROM_TRACK, TrackerLogSource


class Tracker(models.Model):
    tracker_id = models.CharField(max_length=50, db_index=True, unique=True)
    tracker_name = models.CharField(max_length=50, blank=True, null=True)

    last_log = models.OneToOneField('TrackerLog', on_delete=models.SET_NULL, blank=True, null=True, related_name='+')

    class Meta:
        permissions = [
            ('view_heatmap', 'Can view heatmap'),
        ]

    def __str__(self) -> str:
        if self.tracker_name:
            return self.tracker_name
        else:
            return self.tracker_id

    def get_track(self) -> LineString:
        tocht_centroid = Tocht.centroid()
        queryset = self.tracker_logs.filter(team_is_safe=False)
        queryset = queryset.filter(point__distance_lt=(tocht_centroid, D(m=GEBIED_MAX_DISTANCE)))
        if hasattr(self, 'team') and Switch.switch_is_active(SWITCH_EXCLUDE_BASIS_FROM_TRACK):
            basis = Basis.objects.first()
            if basis:
                queryset = queryset.filter(point__distance_gt=(basis.point, D(m=SKIP_BASIS_DISTANCE)))
        queryset = queryset.order_by('gps_datetime')
        points = list(queryset.values_list('point', flat=True))
        if len(points) == 1:
            points = []
        return LineString(points)

    def get_track_geojson(self) -> str:
        tocht_centroid = Tocht.centroid()
        tocht_centroid_ewkb = tocht_centroid.hexewkb.decode('utf-8') if tocht_centroid else None
        with connection.cursor() as cursor:
            cursor.execute(
                """SELECT ST_AsGeoJSON(ST_MakeLine(trackers_trackerlog.point ORDER BY trackers_trackerlog.gps_datetime))
                FROM trackers_trackerlog
                WHERE (
                    trackers_trackerlog.tracker_id = %s
                    AND (%s IS NULL OR ST_DistanceSphere(trackers_trackerlog.point, %s::geometry) < %s)
                    AND NOT trackers_trackerlog.team_is_safe
                )""",
                [self.id, tocht_centroid_ewkb, tocht_centroid_ewkb, GEBIED_MAX_DISTANCE],
            )
            row = cursor.fetchone()
        return row[0]  # type: ignore[no-any-return]


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
