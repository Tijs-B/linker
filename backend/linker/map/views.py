from rest_framework import viewsets

from .models import Weide, Zijweg, Fiche, MapNote, Tocht
from .serializers import (
    WeideSerializer,
    ZijwegSerializer,
    FicheSerializer,
    MapNoteSerializer,
    TochtSerializer,
)


class TochtViewSet(viewsets.ModelViewSet):
    queryset = Tocht.objects.all()
    serializer_class = TochtSerializer


class WeideViewSet(viewsets.ModelViewSet):
    queryset = Weide.objects.all()
    serializer_class = WeideSerializer


class ZijwegViewSet(viewsets.ModelViewSet):
    queryset = Zijweg.objects.all()
    serializer_class = ZijwegSerializer


class FicheViewSet(viewsets.ModelViewSet):
    queryset = Fiche.objects.all()
    serializer_class = FicheSerializer


class MapNoteViewSet(viewsets.ModelViewSet):
    queryset = MapNote.objects.all()
    serializer_class = MapNoteSerializer
