from django.db.models import F, CharField
from django.db.models.functions import Concat
from rest_framework import viewsets

from .models import Weide, Zijweg, Fiche, MapNote, Tocht, Basis, ForbiddenArea
from .serializers import (
    WeideSerializer,
    ZijwegSerializer,
    FicheSerializer,
    MapNoteSerializer,
    TochtSerializer,
    BasisSerializer,
    ForbiddenAreaSerializer,
)


class TochtViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Tocht.objects.all().order_by('order')
    serializer_class = TochtSerializer


class WeideViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Weide.objects.all().annotate(display_name=F('tocht__identifier')).order_by('tocht__order')
    serializer_class = WeideSerializer


class ZijwegViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Zijweg.objects.all()
    serializer_class = ZijwegSerializer


class FicheViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = (
        Fiche.objects.all()
        .annotate(display_name=Concat(F('tocht__identifier'), F('order'), output_field=CharField()))
        .order_by('tocht__order', 'order')
    )
    serializer_class = FicheSerializer


class MapNoteViewSet(viewsets.ModelViewSet):
    queryset = MapNote.objects.all()
    serializer_class = MapNoteSerializer


class BasisViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Basis.objects.all()
    serializer_class = BasisSerializer


class ForbiddenAreaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ForbiddenArea.objects.all()
    serializer_class = ForbiddenAreaSerializer
