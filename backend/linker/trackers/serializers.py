from datetime import timedelta

from django.utils.timezone import now
from rest_framework import serializers

from .constants import TRACKER_OFFLINE_MINUTES
from .models import Tracker, TrackerLog


class TrackerLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrackerLog
        fields = ['id', 'gps_datetime', 'point']
        read_only_fields = fields


class TrackerSerializer(serializers.ModelSerializer):
    last_log = TrackerLogSerializer()
    fiche = serializers.IntegerField(read_only=True)
    weide = serializers.IntegerField(read_only=True)
    tocht = serializers.IntegerField(read_only=True)
    basis = serializers.IntegerField(read_only=True)

    is_online = serializers.SerializerMethodField()
    battery_low = serializers.BooleanField()
    sos_sent = serializers.DateTimeField()

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
            'battery_low',
            'sos_sent',
        ]
        read_only_fields = fields
