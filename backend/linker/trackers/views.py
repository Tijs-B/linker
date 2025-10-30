from django.contrib.gis.measure import D
from django.core.cache import cache
from django.db.models import FloatField, OuterRef, Subquery
from django.db.models.expressions import RawSQL
from django.db.models.query import QuerySet
from django.http import HttpResponse
from django.http.request import HttpRequest
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.mixins import CreateModelMixin
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.serializers import BaseSerializer
from rest_framework.views import APIView

from linker.map.models import Basis, Fiche, ForbiddenArea, Tocht, Weide
from linker.tracing.constants import FICHE_MAX_DISTANCE, GEBIED_MAX_DISTANCE, TOCHT_MAX_DISTANCE, WEIDE_MAX_DISTANCE
from linker.trackers.constants import TrackerLogSource
from linker.trackers.heatmap import get_all_tracks
from linker.trackers.models import Tracker, TrackerLog
from linker.trackers.permissions import CanViewHeatmap, CanViewTrackerLogs
from linker.trackers.serializers import TrackerLogSerializer, TrackerSerializer


class TrackerViewSet(viewsets.ReadOnlyModelViewSet[Tracker]):
    serializer_class = TrackerSerializer

    def get_queryset(self) -> QuerySet[Tracker]:
        queryset = Tracker.objects.select_related('last_log')
        if self.request.user.has_perm('trackers.view_trackerlog'):
            queryset = queryset.annotate(
                fiche=Subquery(
                    Fiche.objects.filter(
                        point__distance_lte=(OuterRef('last_log__point'), D(m=FICHE_MAX_DISTANCE))
                    ).values('pk')[:1]
                ),
                tocht=Subquery(
                    Tocht.objects.filter(
                        route__distance_lte=(OuterRef('last_log__point'), D(m=TOCHT_MAX_DISTANCE))
                    ).values('pk')[:1]
                ),
                weide=Subquery(
                    Weide.objects.filter(
                        polygon__distance_lte=(OuterRef('last_log__point'), D(m=WEIDE_MAX_DISTANCE))
                    ).values('pk')[:1]
                ),
                basis=Subquery(
                    Basis.objects.filter(
                        point__distance_lte=(OuterRef('last_log__point'), D(m=WEIDE_MAX_DISTANCE))
                    ).values('pk')[:1]
                ),
                forbidden_area=Subquery(
                    ForbiddenArea.objects.filter(area__contains=OuterRef('last_log__point')).values('pk')[:1]
                ),
                avg_voltage=RawSQL(
                    """
                        SELECT AVG(analog_input)
                        FROM (
                            SELECT tl.analog_input
                            FROM trackers_trackerlog tl
                            WHERE tl.tracker_id = trackers_tracker.id
                            AND analog_input IS NOT NULL
                            ORDER BY tl.gps_datetime DESC
                            LIMIT 20
                        )
                        """,
                    params=[],
                    output_field=FloatField(),
                ),
            )
        return queryset

    @action(detail=True, methods=['get'], permission_classes=(IsAuthenticated, CanViewTrackerLogs))
    def track(self, request: HttpRequest, pk: int | None = None) -> HttpResponse:
        tracker = self.get_object()
        track = tracker.get_track_geojson()
        return HttpResponse(track, content_type='application/geo+json')

    @action(detail=True, methods=['get'])
    def logs(self, request: HttpRequest, pk: int | None = None) -> HttpResponse:
        tocht_centroid = Tocht.centroid()
        tracker = self.get_object()
        queryset = tracker.tracker_logs.filter(point__distance_lt=(tocht_centroid, D(m=GEBIED_MAX_DISTANCE)))
        queryset = queryset.order_by('gps_datetime')

        response = '['
        for item in queryset.values('id', 'gps_datetime', 'point', 'source', 'tracker_id'):
            response += (
                f'{{"id":{item["id"]},"gps_datetime":"{item["gps_datetime"].isoformat()}",'
                f'"point":{item["point"].json},"source":"{item["source"].value}",'
                f'"tracker":{item["tracker_id"]}}},'
            )
        if response[-1] == ',':
            response = response[:-1]
        response = response + ']'

        return HttpResponse(response, content_type='application/json')


class TrackerLogViewSet(CreateModelMixin, viewsets.GenericViewSet[TrackerLog]):
    serializer_class = TrackerLogSerializer
    queryset = TrackerLog.objects.all()

    def perform_create(self, serializer: BaseSerializer[TrackerLog]) -> None:
        serializer.save(source=TrackerLogSource.MANUAL)


class HeatmapView(APIView):
    permission_classes = (IsAuthenticated, CanViewHeatmap, CanViewTrackerLogs)

    def get(self, request: Request) -> HttpResponse:
        if not (result := cache.get('heatmap-cache')):
            result = get_all_tracks()
            cache.set('heatmap-cache', result, timeout=60)
        return HttpResponse(result, content_type='application/geo+json')
