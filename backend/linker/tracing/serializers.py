from enumfields.drf import EnumSupportSerializerMixin
from rest_framework import serializers

from linker.tracing.models import CheckpointLog


class CheckpointLogSerializer(EnumSupportSerializerMixin, serializers.ModelSerializer):
    class Meta:
        model = CheckpointLog
        fields = ['id', 'arrived', 'left', 'fiche', 'team']
        read_only_fields = fields
