from typing import Any

from django.utils.timezone import now
from enumfields.drf import EnumField
from rest_framework import serializers
from rest_framework_gis.fields import GeometryField

from linker.people.models import OrganizationMember, Team

from .constants import TRACKER_VOLTAGE_RANGE, PositionSource
from .models import Position, Tracker


class PositionSerializer(serializers.ModelSerializer[Position]):
    id = serializers.IntegerField(read_only=True)
    timestamp = serializers.DateTimeField(default=now)
    point = GeometryField(precision=6)
    source = EnumField(PositionSource, default=PositionSource.MANUAL)

    organization_member = serializers.PrimaryKeyRelatedField(
        queryset=OrganizationMember.objects.all(), allow_null=True, required=False
    )
    team = serializers.PrimaryKeyRelatedField(queryset=Team.objects.all(), allow_null=True, required=False)

    def validate(self, data: dict[str, Any]) -> dict[str, Any]:
        if (data.get('organization_member') is not None and data.get('team') is not None) or (
            data.get('team') is None and data.get('organization_member') is None
        ):
            raise serializers.ValidationError('Exactly one of organization_member or team must be provided.')
        return data

    class Meta:
        model = Position
        fields = ['id', 'timestamp', 'point', 'source', 'organization_member', 'team']


class TrackerSerializer(serializers.ModelSerializer[Tracker]):
    is_online = serializers.BooleanField(read_only=True)
    battery_percentage = serializers.SerializerMethodField()

    def get_battery_percentage(self, obj: Tracker) -> int | None:
        if getattr(obj, 'avg_voltage', None) is None:
            return None
        v_min, v_max = TRACKER_VOLTAGE_RANGE
        value = round(100 * (obj.avg_voltage - v_min) / (v_max - v_min))
        return min(100, max(0, value))

    class Meta:
        model = Tracker
        fields = [
            'id',
            'tracker_id',
            'tracker_name',
            'is_online',
            'battery_percentage',
        ]
        read_only_fields = fields
