from enumfields.drf import EnumSupportSerializerMixin
from rest_framework import serializers

from linker.tracing.models import CheckpointLog, Notification


class CheckpointLogSerializer(EnumSupportSerializerMixin, serializers.ModelSerializer[CheckpointLog]):  # type: ignore[misc]
    class Meta:
        model = CheckpointLog
        fields = ['id', 'arrived', 'left', 'fiche', 'team']
        read_only_fields = fields


class NotificationSerializer(EnumSupportSerializerMixin, serializers.ModelSerializer[Notification]):  # type: ignore[misc]
    read = serializers.BooleanField()

    class Meta:
        model = Notification
        fields = ['id', 'notification_type', 'sent', 'tracker', 'read', 'severity']
        read_only_fields = fields
