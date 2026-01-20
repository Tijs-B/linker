from datetime import timedelta

from django.core.cache import cache
from django.db.models import BooleanField, Exists, FloatField, OuterRef
from django.db.models.expressions import ExpressionWrapper, RawSQL
from django.db.models.functions import Now
from django.db.models.query import QuerySet
from django.http import HttpResponse
from rest_framework import viewsets
from rest_framework.mixins import CreateModelMixin
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.serializers import BaseSerializer
from rest_framework.views import APIView

from linker.trackers.constants import TRACKER_OFFLINE_MINUTES, PositionSource
from linker.trackers.heatmap import get_all_tracks
from linker.trackers.models import Position, Tracker, TrackerLog
from linker.trackers.permissions import CanViewHeatmap, CanViewPositions
from linker.trackers.serializers import PositionSerializer, TrackerSerializer


class TrackerViewSet(viewsets.ReadOnlyModelViewSet[Tracker]):
    serializer_class = TrackerSerializer

    def get_queryset(self) -> QuerySet[Tracker]:
        queryset = Tracker.objects.all().annotate(
            is_online=ExpressionWrapper(
                Exists(
                    TrackerLog.objects.filter(
                        tracker_id=OuterRef('pk'),
                        gps_datetime__gte=Now() - timedelta(minutes=TRACKER_OFFLINE_MINUTES),
                    )
                ),
                output_field=BooleanField(),
            )
        )
        if self.request.user.has_perm('trackers.view_trackerlog'):
            queryset = queryset.annotate(
                avg_voltage=RawSQL(
                    """
                    SELECT AVG(analog_input)
                    FROM (SELECT tl.analog_input
                          FROM trackers_trackerlog tl
                          WHERE tl.tracker_id = trackers_tracker.id
                            AND analog_input IS NOT NULL
                          ORDER BY tl.gps_datetime DESC LIMIT 20)
                    """,
                    params=[],
                    output_field=FloatField(),
                ),
            )
        return queryset


class PositionViewSet(CreateModelMixin, viewsets.GenericViewSet[Position]):
    serializer_class = PositionSerializer
    queryset = Position.objects.all()

    def perform_create(self, serializer: BaseSerializer[Position]) -> None:
        serializer.save(source=PositionSource.MANUAL)


class HeatmapView(APIView):
    permission_classes = (IsAuthenticated, CanViewHeatmap, CanViewPositions)

    def get(self, request: Request) -> HttpResponse:
        if not (result := cache.get('heatmap-cache')):
            result = get_all_tracks()
            cache.set('heatmap-cache', result, timeout=60)
        return HttpResponse(result, content_type='application/geo+json')
