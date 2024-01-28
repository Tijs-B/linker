from rest_framework import serializers

from .models import Tracker, TrackerLog


class TrackerLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrackerLog
        fields = ['id', 'gps_datetime', 'point']


class TrackerSerializer(serializers.ModelSerializer):
    last_log = TrackerLogSerializer()

    class Meta:
        model = Tracker
        fields = '__all__'
