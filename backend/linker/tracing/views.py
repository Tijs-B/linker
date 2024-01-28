from rest_framework import viewsets

from linker.tracing.models import CheckpointLog
from linker.tracing.serializers import CheckpointLogSerializer


class CheckpointLogViewSet(viewsets.ModelViewSet):
    queryset = CheckpointLog.objects.all()
    serializer_class = CheckpointLogSerializer
