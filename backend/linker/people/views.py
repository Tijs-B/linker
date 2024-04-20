from json import loads

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import Permission
from django.http import HttpResponse, JsonResponse
from django.views import View
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from .models import Team, OrganizationMember, TeamNote, ContactPerson
from .permissions import CanUploadPicture
from .serializers import (
    TeamSerializer,
    OrganizationMemberSerializer,
    TeamNoteSerializer,
    ContactPersonSerializer,
)


class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects.prefetch_related('contact_persons').prefetch_related('team_notes').order_by('number')
    serializer_class = TeamSerializer

    def get_permissions(self):
        if self.action == 'upload_group_picture':
            return [IsAuthenticated(), CanUploadPicture()]
        return super().get_permissions()

    @action(detail=True, methods=['patch'], url_path='group-picture')
    def upload_group_picture(self, request, pk=None):
        team = self.get_object()
        team.group_picture = request.FILES['picture']
        team.save()
        return HttpResponse(status=200)


class OrganizationMemberViewSet(viewsets.ReadOnlyModelViewSet):
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


class LogoutView(View):
    def post(self, request):
        logout(request)
        return HttpResponse(status=200)


class UserView(View):
    def get(self, request):
        if self.request.user.is_authenticated:
            if self.request.user.is_superuser:
                all_permissions = Permission.objects.all()
            else:
                all_permissions = self.request.user.user_permissions.all() | Permission.objects.filter(
                    group__user=request.user
                )
            data = {
                'username': request.user.username,
                'permissions': list(all_permissions.values_list('codename', flat=True)),
            }
            return JsonResponse(data)
        return HttpResponse(status=404)
