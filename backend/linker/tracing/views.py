from logging import getLogger

from django.core.cache import cache
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from linker.tracing.models import CheckpointLog
from linker.tracing.serializers import CheckpointLogSerializer
from linker.tracing.stats import calculate_stats


logger = getLogger(__name__)


class CheckpointLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = CheckpointLog.objects.all()
    serializer_class = CheckpointLogSerializer


class StatsView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request: Request) -> Response:
        if not (stats := cache.get('tracing_stats')):
            stats = calculate_stats()
            logger.info('Tracing stats cache miss, regenerated stats')
            cache.set('tracing_stats', stats, 30)
        else:
            logger.info('Tracing stats cache hit')
        return Response(stats)
