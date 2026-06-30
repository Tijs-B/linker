import sqlite3
from datetime import timedelta
from pathlib import Path

from django.conf import settings
from django.db.models import BooleanField, Exists, FloatField, OuterRef
from django.db.models.expressions import ExpressionWrapper, RawSQL
from django.db.models.functions import Now
from django.db.models.query import QuerySet
from django.http import HttpResponse
from rest_framework import status, viewsets
from rest_framework.mixins import CreateModelMixin
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.serializers import BaseSerializer
from rest_framework.views import APIView

from linker.people.models import OrganizationMember, Team
from linker.trackers.constants import TRACKER_OFFLINE_MINUTES, PositionSource
from linker.trackers.models import Position, Tracker, TrackerLog
from linker.trackers.permissions import CanViewHeatmap, CanViewPositions
from linker.trackers.serializers import PhoneGpsPositionSerializer, PositionSerializer, TrackerSerializer


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


class PhoneGpsPositionView(APIView):
    permission_classes = (AllowAny,)
    authentication_classes = ()

    def get(self, request: Request) -> Response:
        token = request.query_params.get('token')
        if not token:
            return Response({'detail': 'token required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            team = Team.objects.get(tracker_token=token)
            return Response({'label': f'G{team.number:02d}'})
        except Team.DoesNotExist:
            pass
        try:
            member = OrganizationMember.objects.get(tracker_token=token)
            return Response({'label': member.name})
        except OrganizationMember.DoesNotExist:
            pass
        return Response({'detail': 'Invalid token.'}, status=status.HTTP_404_NOT_FOUND)

    def post(self, request: Request) -> Response:
        serializer = PhoneGpsPositionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(status=status.HTTP_201_CREATED)


class HeatmapTileView(APIView):
    permission_classes = (IsAuthenticated, CanViewHeatmap, CanViewPositions)

    def get(self, request: Request, z: int, x: int, y: int) -> HttpResponse:
        mbtiles_path = Path(settings.HEATMAP_MBTILES_PATH)
        if not mbtiles_path.exists():
            return HttpResponse(status=204)

        tms_row = (2**z - 1) - y
        connection = sqlite3.connect(f'file:{mbtiles_path}?mode=ro', uri=True)
        try:
            cursor = connection.execute(
                'SELECT tile_data FROM tiles WHERE zoom_level = ? AND tile_column = ? AND tile_row = ?',
                (z, x, tms_row),
            )
            row = cursor.fetchone()
        finally:
            connection.close()

        if row is None:
            return HttpResponse(status=204)

        response = HttpResponse(row[0], content_type='application/x-protobuf')
        response['Content-Encoding'] = 'gzip'
        return response
