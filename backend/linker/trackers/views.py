from json import loads

from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D
from django.db.models import Subquery, OuterRef
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from linker.map.models import Fiche, Tocht, Weide, Basis
from linker.tracing.constants import FICHE_MAX_DISTANCE, TOCHT_MAX_DISTANCE, WEIDE_MAX_DISTANCE
from linker.trackers.models import Tracker
from linker.trackers.serializers import TrackerSerializer, TrackerLogSerializer


class TrackerViewSet(viewsets.ModelViewSet):
    queryset = Tracker.objects.select_related('last_log').annotate(
        fiche=Subquery(Fiche.objects
                       .filter(point__distance_lte=(OuterRef('last_log__point'), D(m=FICHE_MAX_DISTANCE)))
                       .values('pk')[:1]),
        tocht=Subquery(Tocht.objects
                       .filter(route__distance_lte=(OuterRef('last_log__point'), D(m=TOCHT_MAX_DISTANCE)))
                       .values('pk')[:1]),
        weide=Subquery(Weide.objects
                       .filter(polygon__distance_lte=(OuterRef('last_log__point'), D(m=WEIDE_MAX_DISTANCE)))
                       .values('pk')[:1]),
        basis=Subquery(Basis.objects
                       .filter(point__distance_lte=(OuterRef('last_log__point'), D(m=WEIDE_MAX_DISTANCE)))
                       .values('pk')[:1]),
    )
    serializer_class = TrackerSerializer

    @action(detail=True, methods=['get'])
    def track(self, request, pk=None):
        tracker = self.get_object()
        skip_basis = hasattr(tracker, 'team')
        track = loads(tracker.get_track(skip_basis=skip_basis).json)
        return Response(track)

    @action(detail=True, methods=['get'])
    def logs(self, request, pk=None):
        tracker = self.get_object()
        basis = Point(5.920033, 50.354934)
        queryset = tracker.tracker_logs.order_by('gps_datetime')
        if hasattr(tracker, 'team'):
            queryset = queryset.filter(point__distance_gt=(basis, D(m=50)))

        serializer = TrackerLogSerializer(queryset, many=True)
        return Response(serializer.data)
