from logging import getLogger

from django.core.cache import cache
from django.db.models import Exists, OuterRef
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from linker.tracing.models import CheckpointLog, Notification, ReadNotification
from linker.tracing.serializers import CheckpointLogSerializer, NotificationSerializer
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


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer

    def get_queryset(self):
        user = self.request.user
        return Notification.objects.annotate(
            read=Exists(ReadNotification.objects.filter(user=user, notification=OuterRef('pk')))
        ).order_by('read', '-severity', '-sent')

    @action(detail=True, methods=['post'], url_path='mark-as-read')
    def mark_as_read(self, request: Request, *args, **kwargs) -> Response:
        notification = self.get_object()
        ReadNotification.objects.get_or_create(user=request.user, notification=notification)
        return Response(status=200)

    @action(detail=False, methods=['post'], url_path='mark-all-as-read')
    def mark_all_as_read(self, request: Request, *args, **kwargs) -> Response:
        all_notifications = Notification.objects.all().values_list('pk', flat=True)
        to_create = [ReadNotification(notification_id=pk, user=request.user) for pk in all_notifications]
        ReadNotification.objects.bulk_create(to_create, ignore_conflicts=True)
        return Response(status=200)
