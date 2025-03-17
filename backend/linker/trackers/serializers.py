from datetime import timedelta

from django.utils.timezone import now
from enumfields.drf import EnumField
from rest_framework import serializers
from rest_framework_gis.fields import GeometryField

from .constants import TRACKER_OFFLINE_MINUTES, TrackerLogSource
from .models import Tracker, TrackerLog


class TrackerLogSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    gps_datetime = serializers.DateTimeField(default=now)
    point = GeometryField(precision=6)
    source = EnumField(TrackerLogSource, default=TrackerLogSource.MANUAL)
    tracker = serializers.PrimaryKeyRelatedField(queryset=Tracker.objects.all())

    def create(self, validated_data):
        tracker_log = TrackerLog.objects.create(**validated_data)
        tracker = tracker_log.tracker
        tracker.last_log = tracker.tracker_logs.latest('gps_datetime')
        tracker.save()
        return tracker_log


class TrackerSerializer(serializers.ModelSerializer):
    last_log = TrackerLogSerializer()
    fiche = serializers.IntegerField(read_only=True)
    weide = serializers.IntegerField(read_only=True)
    tocht = serializers.IntegerField(read_only=True)
    basis = serializers.IntegerField(read_only=True)

    is_online = serializers.SerializerMethodField()

    def get_is_online(self, obj):
        if obj.last_log is None:
            return False
        return obj.last_log.gps_datetime >= now() - timedelta(minutes=TRACKER_OFFLINE_MINUTES)

    class Meta:
        model = Tracker
        fields = [
            'id',
            'last_log',
            'tracker_id',
            'tracker_name',
            'fiche',
            'weide',
            'tocht',
            'basis',
            'is_online',
        ]
        read_only_fields = fields
