from json import loads

from django.contrib.auth import authenticate, login
from django.http import HttpResponse
from django.views import View
from rest_framework import viewsets

from .models import Team, OrganizationMember, TeamNote, ContactPerson
from .serializers import (
    TeamSerializer,
    OrganizationMemberSerializer,
    TeamNoteSerializer,
    ContactPersonSerializer,
)


class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects.prefetch_related('contact_persons').prefetch_related('team_notes').order_by('number')
    serializer_class = TeamSerializer


class OrganizationMemberViewSet(viewsets.ModelViewSet):
    queryset = OrganizationMember.objects.order_by('member_type', 'name')
    serializer_class = OrganizationMemberSerializer


class TeamNoteViewSet(viewsets.ModelViewSet):
    queryset = TeamNote.objects.all()
    serializer_class = TeamNoteSerializer


class ContactPersonViewSet(viewsets.ModelViewSet):
    queryset = ContactPerson.objects.all()
    serializer_class = ContactPersonSerializer


class LoginView(View):
    def post(self, request):
        data = loads(request.body)
        username = data.get('username')
        password = data.get('password')
        user = authenticate(request, username=username, password=password)
        if user is None:
            return HttpResponse(status=404)
        login(request, user)
        return HttpResponse(status=200)
