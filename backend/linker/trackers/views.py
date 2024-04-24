from datetime import timedelta
from json import loads

from django.contrib.gis.measure import D
from django.db.models import Subquery, OuterRef, Exists
from django.utils.timezone import now
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from linker.map.models import Fiche, Tocht, Weide, Basis
from linker.tracing.constants import FICHE_MAX_DISTANCE, TOCHT_MAX_DISTANCE, WEIDE_MAX_DISTANCE
from linker.trackers.constants import TRACKER_BATTERY_LOW_MINUTES
from linker.trackers.models import Tracker, TrackerLog
from linker.trackers.serializers import TrackerSerializer, TrackerLogSerializer


class TrackerViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TrackerSerializer

    def get_queryset(self):
        return (
            Tracker.objects.select_related('last_log')
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
                battery_low=Exists(
                    TrackerLog.objects.filter(
                        tracker=OuterRef('pk'),
                        gps_datetime__gte=now() - timedelta(minutes=TRACKER_BATTERY_LOW_MINUTES),
                        tracker_type__in=(1000, 1001, 1002),
                    )
                ),
                sos_sent=Subquery(
                    TrackerLog.objects.filter(tracker=OuterRef('pk'), tracker_type=17006)
                    .order_by('-gps_datetime')
                    .values('gps_datetime')[:1]
                ),
            )
        )

    @action(detail=True, methods=['get'])
    def track(self, request, pk=None):
        tracker = self.get_object()
        track = loads(tracker.get_track().json)
        return Response(track)

    @action(detail=True, methods=['get'])
    def logs(self, request, pk=None):
        tracker = self.get_object()
        queryset = tracker.tracker_logs.order_by('gps_datetime')

        serializer = TrackerLogSerializer(queryset, many=True)
        return Response(serializer.data)
