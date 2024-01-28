from rest_framework import viewsets

from .models import Team, OrganizationMember, TeamNote
from .serializers import TeamSerializer, OrganizationMemberSerializer, TeamNoteSerializer


class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects \
        .prefetch_related('contact_persons') \
        .prefetch_related('team_notes') \
        .order_by('number')
    serializer_class = TeamSerializer


class OrganizationMemberViewSet(viewsets.ModelViewSet):
    queryset = OrganizationMember.objects \
        .order_by('member_type', 'name')
    serializer_class = OrganizationMemberSerializer


class TeamNoteViewSet(viewsets.ModelViewSet):
    queryset = TeamNote.objects.all()
    serializer_class = TeamNoteSerializer
