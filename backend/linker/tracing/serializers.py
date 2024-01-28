from enumfields.drf import EnumSupportSerializerMixin
from rest_framework import serializers

from linker.tracing.models import CheckpointLog


class CheckpointLogSerializer(EnumSupportSerializerMixin, serializers.ModelSerializer):
    # fiche = FicheSerializer
    class Meta:
        model = CheckpointLog
        fields = '__all__'
