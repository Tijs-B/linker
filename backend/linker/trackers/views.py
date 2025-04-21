from django.contrib.gis.measure import D
from django.core.cache import cache
from django.db.models import OuterRef, Subquery
from django.http import HttpResponse
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.mixins import CreateModelMixin
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.views import APIView

from linker.map.models import Basis, Fiche, ForbiddenArea, Tocht, Weide
from linker.tracing.constants import FICHE_MAX_DISTANCE, GEBIED_MAX_DISTANCE, TOCHT_MAX_DISTANCE, WEIDE_MAX_DISTANCE
from linker.trackers.constants import TrackerLogSource
from linker.trackers.heatmap import get_all_tracks
from linker.trackers.models import Tracker, TrackerLog
from linker.trackers.serializers import TrackerLogSerializer, TrackerSerializer


class TrackerViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TrackerSerializer

    def get_queryset(self):
        return (
            Tracker.objects.select_related('last_log', 'team', 'organizationmember')
            .order_by('tracker_name')
            .annotate(
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
            )
        )

    @action(detail=True, methods=['get'])
    def track(self, request, pk=None):
        tracker = self.get_object()
        track = tracker.get_track_geojson()
        return HttpResponse(track, content_type='application/geo+json')

    @action(detail=True, methods=['get'])
    def logs(self, request, pk=None):
        tocht_centroid = Tocht.centroid()
        tracker = self.get_object()
        queryset = tracker.tracker_logs.filter(point__distance_lt=(tocht_centroid, D(m=GEBIED_MAX_DISTANCE)))
        queryset = queryset.order_by('gps_datetime')
        queryset = queryset.values('id', 'gps_datetime', 'point', 'source', 'tracker_id')

        response = '['
        for item in queryset:
            response += (
                f'{{"id":{item["id"]},"gps_datetime":"{item["gps_datetime"].isoformat()}",'
                f'"point":{item["point"].json},"source":"{item["source"].value}",'
                f'"tracker":{item["tracker_id"]}}},'
            )
        if response[-1] == ',':
            response = response[:-1]
        response = response + ']'

        return HttpResponse(response, content_type='application/json')


class TrackerLogViewSet(CreateModelMixin, viewsets.GenericViewSet):
    serializer_class = TrackerLogSerializer
    queryset = TrackerLog.objects.all()

    def perform_create(self, serializer):
        serializer.save(source=TrackerLogSource.MANUAL)


class HeatmapView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request: Request) -> HttpResponse:
        if not (result := cache.get('heatmap-cache')):
            result = get_all_tracks()
            cache.set('heatmap-cache', result, timeout=60)
        return HttpResponse(result, content_type='application/geo+json')
