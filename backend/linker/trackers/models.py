from django.contrib.gis.db.models import MakeLine
from django.contrib.gis.geos import Point, LineString, MultiLineString
from django.contrib.gis.db import models
from django.contrib.gis.measure import D

from linker.map.models import Basis


class Tracker(models.Model):
    tracker_id = models.CharField(max_length=50, db_index=True, unique=True)
    tracker_code = models.CharField(max_length=50, blank=True, null=True)

    last_log = models.OneToOneField('TrackerLog', on_delete=models.SET_NULL, blank=True, null=True, related_name='+')

    def __str__(self):
        if self.tracker_code:
            return self.tracker_code
        else:
            return self.tracker_id

    def get_track(self, skip_basis: bool = False) -> LineString:
        queryset = self.tracker_logs
        if skip_basis:
            basis = Basis.objects.first()
            queryset = queryset.filter(point__distance_gt=(basis.point, D(m=100)))
        queryset = queryset.order_by('gps_datetime')
        return LineString(list(queryset.values_list('point', flat=True)))


class TrackerLog(models.Model):
    tracker = models.ForeignKey(Tracker, on_delete=models.CASCADE, related_name='tracker_logs')
    gps_datetime = models.DateTimeField(db_index=True)
    point = models.PointField()

    # The below fields are less important.
    fetch_datetime = models.DateTimeField(db_index=True)
    local_datetime = models.DateTimeField(blank=True, null=True)
    last_sync_date = models.DateTimeField(blank=True, null=True)
    satellites = models.IntegerField(blank=True, null=True)
    input_acc = models.BooleanField(blank=True, null=True)
    voltage = models.CharField(max_length=30, blank=True, null=True)
    analog_input = models.FloatField(blank=True, null=True)
    tracker_type = models.IntegerField(blank=True, null=True)
    heading = models.IntegerField(blank=True, null=True)
    speed = models.IntegerField(blank=True, null=True)
    is_online = models.BooleanField(blank=True, null=True)
    has_gps = models.BooleanField(blank=True, null=True)
    has_power = models.BooleanField(blank=True, null=True)
    is_online_threshold = models.IntegerField(blank=True, null=True)
    name = models.CharField(max_length=30, blank=True, null=True)
    code = models.CharField(max_length=30, blank=True, null=True)

    class Meta:
        unique_together = [['tracker', 'gps_datetime']]

    def __str__(self):
        return f'{self.tracker} {self.gps_datetime}'
