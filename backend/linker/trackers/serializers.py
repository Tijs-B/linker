from datetime import timedelta

from django.utils.timezone import now
from rest_framework import serializers
from rest_framework_gis.fields import GeometryField

from .constants import TRACKER_OFFLINE_MINUTES
from .models import Tracker


class TrackerLogSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    gps_datetime = serializers.DateTimeField(read_only=True)
    point = GeometryField(read_only=True, precision=6)


class TrackerSerializer(serializers.ModelSerializer):
    last_log = TrackerLogSerializer()
    fiche = serializers.IntegerField(read_only=True)
    weide = serializers.IntegerField(read_only=True)
    tocht = serializers.IntegerField(read_only=True)
    basis = serializers.IntegerField(read_only=True)

    is_coupled = serializers.SerializerMethodField()
    is_online = serializers.SerializerMethodField()
    battery_low = serializers.BooleanField()
    sos_sent = serializers.DateTimeField()

    def get_is_coupled(self, obj):
        return hasattr(obj, 'team') or hasattr(obj, 'organizationmember')

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
            'is_coupled',
            'is_online',
            'battery_low',
            'sos_sent',
        ]
        read_only_fields = fields
