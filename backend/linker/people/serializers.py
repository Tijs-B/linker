from enumfields.drf import EnumSupportSerializerMixin
from rest_framework import serializers

from .models import ContactPerson, OrganizationMember, TeamNote, Team


class ContactPersonSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactPerson
        fields = ['id', 'name', 'phone_number', 'email_address', 'is_favorite', 'team']


class OrganizationMemberSerializer(EnumSupportSerializerMixin, serializers.ModelSerializer):
    class Meta:
        model = OrganizationMember
        fields = '__all__'


class TeamNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeamNote
        fields = '__all__'


class TeamSerializer(EnumSupportSerializerMixin, serializers.ModelSerializer):
    contact_persons = ContactPersonSerializer(many=True)
    team_notes = TeamNoteSerializer(many=True)

    class Meta:
        model = Team
        fields = [
            'id',
            'direction',
            'number',
            'name',
            'chiro',
            'start_weide_1',
            'start_weide_2',
            'eind_weide_1',
            'eind_weide_2',
            'tracker',
            'contact_persons',
            'team_notes',
            'group_picture',
            'safe_weide',
        ]
