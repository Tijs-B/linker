from rest_framework import serializers

from .models import Tracker, TrackerLog


class TrackerLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrackerLog
        fields = ['id', 'gps_datetime', 'point']


class TrackerSerializer(serializers.ModelSerializer):
    last_log = TrackerLogSerializer()
    fiche = serializers.IntegerField(read_only=True)
    weide = serializers.IntegerField(read_only=True)
    tocht = serializers.IntegerField(read_only=True)
    basis = serializers.IntegerField(read_only=True)

    class Meta:
        model = Tracker
        fields = ['id', 'last_log', 'tracker_id', 'tracker_code', 'fiche', 'weide', 'tocht', 'basis']
