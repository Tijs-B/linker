from datetime import timedelta

from django.utils.timezone import now
from enumfields.drf import EnumSupportSerializerMixin
from rest_framework import serializers
from rest_framework_gis.fields import GeometryField

from linker.trackers.constants import TRACKER_OFFLINE_MINUTES

from .models import ContactPerson, OrganizationMember, Team, TeamNote


class LocationSerializerMixin(metaclass=serializers.SerializerMetaclass):
    fiche = serializers.IntegerField(read_only=True, required=False, default=None, allow_null=True)
    weide = serializers.IntegerField(read_only=True, required=False, default=None, allow_null=True)
    tocht = serializers.IntegerField(
        source='nearest_tocht', read_only=True, required=False, default=None, allow_null=True
    )
    basis = serializers.IntegerField(read_only=True, required=False, default=None, allow_null=True)
    forbidden_area = serializers.IntegerField(read_only=True, required=False, default=None, allow_null=True)
    last_position_point = GeometryField(read_only=True, required=False, default=None, allow_null=True)
    last_position_timestamp = serializers.DateTimeField(read_only=True, required=False, default=None, allow_null=True)
    is_online = serializers.SerializerMethodField()

    def get_is_online(self, obj: Team | OrganizationMember) -> bool:
        if obj.last_position_timestamp is None:
            return False
        return obj.last_position_timestamp >= now() - timedelta(minutes=TRACKER_OFFLINE_MINUTES)


class ContactPersonSerializer(serializers.ModelSerializer[ContactPerson]):
    class Meta:
        model = ContactPerson
        fields = ['id', 'name', 'phone_number', 'email_address', 'is_favorite', 'team']


class OrganizationMemberSerializer(
    LocationSerializerMixin, EnumSupportSerializerMixin, serializers.ModelSerializer[OrganizationMember]
):  # type: ignore[misc]
    class Meta:
        model = OrganizationMember
        fields = '__all__'


class TeamNoteSerializer(serializers.ModelSerializer[TeamNote]):
    author: serializers.StringRelatedField[TeamNote] = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = TeamNote
        fields = '__all__'


class BasicTeamSerializer(LocationSerializerMixin, EnumSupportSerializerMixin, serializers.ModelSerializer[Team]):  # type: ignore[misc]
    name = serializers.SerializerMethodField('return_empty')
    chiro = serializers.SerializerMethodField('return_empty')
    code = serializers.SerializerMethodField('return_empty')
    last_safety_location = serializers.CharField(required=False, default=None, allow_null=True, allow_blank=True)
    last_safety_location_updated_at = serializers.DateTimeField(
        read_only=True, required=False, default=None, allow_null=True
    )
    last_safety_location_updated_by = serializers.CharField(
        read_only=True, required=False, default=None, allow_null=True
    )

    def return_empty(self, obj: Team) -> str:
        return ''

    class Meta:
        model = Team
        fields = [
            'id',
            'direction',
            'number',
            'name',
            'chiro',
            'tracker',
            'contact_persons',
            'team_notes',
            'last_safety_location',
            'last_safety_location_updated_at',
            'last_safety_location_updated_by',
            'code',
            'fiche',
            'weide',
            'tocht',
            'basis',
            'forbidden_area',
            'last_position_point',
            'last_position_timestamp',
            'is_online',
        ]


class TeamWithNumberSerializer(LocationSerializerMixin, EnumSupportSerializerMixin, serializers.ModelSerializer[Team]):  # type: ignore[misc]
    name = serializers.SerializerMethodField('return_empty')
    chiro = serializers.SerializerMethodField('return_empty')
    code = serializers.SerializerMethodField('get_code')
    last_safety_location = serializers.CharField(required=False, default=None, allow_null=True, allow_blank=True)
    last_safety_location_updated_at = serializers.DateTimeField(
        read_only=True, required=False, default=None, allow_null=True
    )
    last_safety_location_updated_by = serializers.CharField(
        read_only=True, required=False, default=None, allow_null=True
    )

    def return_empty(self, obj: Team) -> str:
        return ''

    def get_code(self, obj: Team) -> str:
        return f'{obj.number:02d}'

    class Meta:
        model = Team
        fields = [
            'id',
            'direction',
            'number',
            'name',
            'chiro',
            'tracker',
            'contact_persons',
            'team_notes',
            'last_safety_location',
            'last_safety_location_updated_at',
            'last_safety_location_updated_by',
            'code',
            'fiche',
            'weide',
            'tocht',
            'basis',
            'forbidden_area',
            'last_position_point',
            'last_position_timestamp',
            'is_online',
        ]


class TeamSerializer(LocationSerializerMixin, EnumSupportSerializerMixin, serializers.ModelSerializer[Team]):  # type: ignore[misc]
    contact_persons = ContactPersonSerializer(many=True)
    team_notes = TeamNoteSerializer(many=True)
    code = serializers.SerializerMethodField('get_code')
    last_safety_location = serializers.CharField(required=False, default=None, allow_null=True, allow_blank=True)
    last_safety_location_updated_at = serializers.DateTimeField(
        read_only=True, required=False, default=None, allow_null=True
    )
    last_safety_location_updated_by = serializers.CharField(
        read_only=True, required=False, default=None, allow_null=True
    )

    def get_code(self, obj: Team) -> str:
        return f'{obj.number:02d}'

    class Meta:
        model = Team
        fields = [
            'id',
            'direction',
            'number',
            'name',
            'chiro',
            'tracker',
            'contact_persons',
            'team_notes',
            'last_safety_location',
            'last_safety_location_updated_at',
            'last_safety_location_updated_by',
            'code',
            'fiche',
            'weide',
            'tocht',
            'basis',
            'forbidden_area',
            'last_position_point',
            'last_position_timestamp',
            'is_online',
        ]
        read_only_fields = ['last_safety_location_updated_at', 'last_safety_location_updated_by']
