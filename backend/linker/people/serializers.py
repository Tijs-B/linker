from enumfields.drf import EnumSupportSerializerMixin
from rest_framework import serializers

from .models import ContactPerson, OrganizationMember, Team, TeamNote


class ContactPersonSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactPerson
        fields = ['id', 'name', 'phone_number', 'email_address', 'is_favorite', 'team']


class OrganizationMemberSerializer(EnumSupportSerializerMixin, serializers.ModelSerializer):
    class Meta:
        model = OrganizationMember
        fields = '__all__'


class TeamNoteSerializer(serializers.ModelSerializer):
    author = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = TeamNote
        fields = '__all__'


class TeamSerializer(EnumSupportSerializerMixin, serializers.ModelSerializer):
    contact_persons = ContactPersonSerializer(many=True)
    team_notes = TeamNoteSerializer(many=True)
    code = serializers.SerializerMethodField('get_code')
    safe_weide_updated_by = serializers.StringRelatedField(read_only=True)

    def get_code(self, obj):
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
            'safe_weide',
            'safe_weide_updated_at',
            'safe_weide_updated_by',
            'code',
        ]
        read_only_fields = ['safe_weide_updated_at']
