from rest_framework import serializers

from .models import Tocht, Fiche, Weide, Zijweg, MapNote, Basis, ForbiddenArea


class TochtSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tocht
        fields = ['id', 'identifier', 'order', 'route']
        read_only_fields = fields


class FicheSerializer(serializers.ModelSerializer):
    display_name = serializers.CharField()

    class Meta:
        model = Fiche
        fields = ['id', 'order', 'point', 'tocht', 'display_name']
        read_only_fields = fields


class WeideSerializer(serializers.ModelSerializer):
    class Meta:
        model = Weide
        fields = ['id', 'identifier', 'name', 'polygon', 'tocht']
        read_only_fields = fields


class ZijwegSerializer(serializers.ModelSerializer):
    class Meta:
        model = Zijweg
        fields = ['id', 'geom']
        read_only_fields = fields


class MapNoteSerializer(serializers.ModelSerializer):
    author = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = MapNote
        fields = ['id', 'created', 'updated', 'content', 'point', 'author']
        read_only_fields = ['created', 'updated', 'author']


class BasisSerializer(serializers.ModelSerializer):
    class Meta:
        model = Basis
        fields = ['id', 'point']
        read_only_fields = fields


class ForbiddenAreaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ForbiddenArea
        fields = ['id', 'description', 'area']
        read_only_fields = fields
