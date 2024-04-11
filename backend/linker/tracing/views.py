from django.http import JsonResponse
from rest_framework import viewsets

from linker.tracing.models import CheckpointLog
from linker.tracing.serializers import CheckpointLogSerializer
from linker.tracing.stats import calculate_stats


class CheckpointLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = CheckpointLog.objects.all()
    serializer_class = CheckpointLogSerializer


def all_stats(request):
    stats = calculate_stats()
    return JsonResponse(stats)
