from django.contrib.gis.geos import MultiLineString, Point, LineString
from django.contrib.gis.db import models
from geopy.distance import distance


class Tracker(models.Model):
    tracker_id = models.CharField(max_length=50, db_index=True)
    tracker_code = models.CharField(max_length=50, blank=True, null=True)

    last_log = models.OneToOneField('TrackerLog', on_delete=models.SET_NULL, blank=True, null=True, related_name='+')

    def __str__(self):
        if self.tracker_code:
            return self.tracker_code
        else:
            return self.tracker_id

    def get_track(self, skip_jumps: bool = False, skip_basis: bool = False) -> MultiLineString:
        points = self.tracker_logs.order_by('gps_datetime').values_list('point', flat=True)
        if len(points) <= 1:
            return MultiLineString()

        # TODO: haal basis uit database
        basis = Point(5.920033, 50.354934)
        if skip_basis:
            first_point_index = next(i for i in range(len(points)) if distance(points[i], basis) > 0.2)
        else:
            first_point_index = 0

        lines = [[points[first_point_index]]]
        for point in points[first_point_index + 1:]:
            if skip_basis and distance(basis, point).km < 0.2:
                continue
            if skip_jumps and distance(lines[-1][-1], point).km > 1:
                lines.append([point])
            else:
                lines[-1].append(point)

        return MultiLineString([LineString(line) for line in lines if len(line) > 1])


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

    def __str__(self):
        return f"{self.tracker} {self.gps_datetime}"


