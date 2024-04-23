from logging import getLogger

from django.contrib.auth.decorators import login_required
from django.core.cache import cache
from django.http import JsonResponse
from rest_framework import viewsets

from linker.tracing.models import CheckpointLog
from linker.tracing.serializers import CheckpointLogSerializer
from linker.tracing.stats import calculate_stats


logger = getLogger(__name__)


class CheckpointLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = CheckpointLog.objects.all()
    serializer_class = CheckpointLogSerializer


@login_required
def all_stats(request):
    stats = cache.get('tracing_stats')
    if stats is None:
        stats = calculate_stats()
        logger.info('Tracing stats cache miss, regenerated stats')
        cache.set('tracing_stats', stats, 30)
    else:
        logger.info('Tracing stats cache hit')
    return JsonResponse(stats)
