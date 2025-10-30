from rest_framework import serializers

from .models import Basis, Fiche, ForbiddenArea, MapNote, Tocht, Weide, Zijweg


class TochtSerializer(serializers.ModelSerializer[Tocht]):
    class Meta:
        model = Tocht
        fields = ['id', 'identifier', 'is_alternative', 'order', 'route']
        read_only_fields = fields


class FicheSerializer(serializers.ModelSerializer[Fiche]):
    display_name = serializers.CharField()

    class Meta:
        model = Fiche
        fields = ['id', 'order', 'point', 'tocht', 'display_name']
        read_only_fields = fields


class WeideSerializer(serializers.ModelSerializer[Weide]):
    class Meta:
        model = Weide
        fields = ['id', 'identifier', 'name', 'polygon', 'tocht']
        read_only_fields = fields


class ZijwegSerializer(serializers.ModelSerializer[Zijweg]):
    class Meta:
        model = Zijweg
        fields = ['id', 'geom']
        read_only_fields = fields


class MapNoteSerializer(serializers.ModelSerializer[MapNote]):
    author: serializers.StringRelatedField[MapNote] = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = MapNote
        fields = ['id', 'created', 'updated', 'content', 'point', 'author']
        read_only_fields = ['created', 'updated', 'author']


class BasisSerializer(serializers.ModelSerializer[Basis]):
    class Meta:
        model = Basis
        fields = ['id', 'point']
        read_only_fields = fields


class ForbiddenAreaSerializer(serializers.ModelSerializer[ForbiddenArea]):
    class Meta:
        model = ForbiddenArea
        fields = ['id', 'description', 'area', 'route_allowed']
        read_only_fields = fields
