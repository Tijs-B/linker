from django.db.models import Case, CharField, F, Q, Value, When
from django.db.models.functions import Concat
from rest_framework import viewsets
from rest_framework.serializers import BaseSerializer

from .models import Basis, Fiche, ForbiddenArea, MapNote, Tocht, Weide, Zijweg
from .serializers import (
    BasisSerializer,
    FicheSerializer,
    ForbiddenAreaSerializer,
    MapNoteSerializer,
    TochtSerializer,
    WeideSerializer,
    ZijwegSerializer,
)


class TochtViewSet(viewsets.ReadOnlyModelViewSet[Tocht]):
    queryset = Tocht.objects.all().order_by('order')
    serializer_class = TochtSerializer


class WeideViewSet(viewsets.ReadOnlyModelViewSet[Weide]):
    queryset = Weide.objects.annotate(
        sort_order=Case(
            When(Q(identifier='S'), then=Value(0)),
            default='tocht__order',
        )
    ).order_by('sort_order')
    serializer_class = WeideSerializer


class ZijwegViewSet(viewsets.ReadOnlyModelViewSet[Zijweg]):
    queryset = Zijweg.objects.all()
    serializer_class = ZijwegSerializer


class FicheViewSet(viewsets.ReadOnlyModelViewSet[Fiche]):
    queryset = (
        Fiche.objects.all()
        .annotate(display_name=Concat(F('tocht__identifier'), F('order'), output_field=CharField()))
        .order_by('tocht__order', 'order')
    )
    serializer_class = FicheSerializer


class MapNoteViewSet(viewsets.ModelViewSet[MapNote]):
    queryset = MapNote.objects.all().select_related('author')
    serializer_class = MapNoteSerializer

    def perform_create(self, serializer: BaseSerializer[MapNote]) -> None:
        serializer.save(author=self.request.user)


class BasisViewSet(viewsets.ReadOnlyModelViewSet[Basis]):
    queryset = Basis.objects.all()
    serializer_class = BasisSerializer


class ForbiddenAreaViewSet(viewsets.ReadOnlyModelViewSet[ForbiddenArea]):
    queryset = ForbiddenArea.objects.all()
    serializer_class = ForbiddenAreaSerializer
