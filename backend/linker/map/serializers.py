from rest_framework import serializers

from .models import Tocht, Fiche, Weide, Zijweg, MapNote


class TochtSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tocht
        fields = ['id', 'identifier', 'order', 'route']


class FicheSerializer(serializers.ModelSerializer):
    class Meta:
        model = Fiche
        fields = ['id', 'order', 'point', 'tocht']


class WeideSerializer(serializers.ModelSerializer):
    class Meta:
        model = Weide
        fields = ['id', 'tocht', 'polygon']


class ZijwegSerializer(serializers.ModelSerializer):
    class Meta:
        model = Zijweg
        fields = ['id', 'geom']


class MapNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = MapNote
        fields = ['id', 'created', 'updated', 'content', 'point']
        read_only_fields = ['created', 'updated']
