from json import loads

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import Permission
from django.db.models import Prefetch
from django.http import HttpResponse, JsonResponse
from django.utils.timezone import now
from django.views import View
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from .models import ContactPerson, OrganizationMember, Team, TeamNote
from .permissions import CanUploadPicture
from .serializers import (
    ContactPersonSerializer,
    OrganizationMemberSerializer,
    TeamNoteSerializer,
    TeamSerializer,
)


class TeamViewSet(viewsets.ModelViewSet):
    serializer_class = TeamSerializer

    def get_queryset(self):
        if self.request.user.has_perm('people.view_contactperson'):
            contact_person_inner_queryset = ContactPerson.objects.order_by('name')
        else:
            contact_person_inner_queryset = ContactPerson.objects.order_by('name')

        queryset = (
            Team.objects.prefetch_related(
                Prefetch('team_notes', queryset=TeamNote.objects.order_by('created').select_related('author')),
                Prefetch('contact_persons', queryset=contact_person_inner_queryset),
            )
            .select_related('safe_weide_updated_by')
            .order_by('number')
        )

        return queryset

    def get_permissions(self):
        if self.action == 'upload_group_picture':
            return [IsAuthenticated(), CanUploadPicture()]
        return super().get_permissions()

    def perform_update(self, serializer: TeamSerializer):
        if serializer.validated_data.get('safe_weide'):
            serializer.save(safe_weide_updated_at=now(), safe_weide_updated_by=self.request.user)
        else:
            serializer.save()

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
    queryset = TeamNote.objects.all().select_related('author')
    serializer_class = TeamNoteSerializer

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class ContactPersonViewSet(viewsets.ModelViewSet):
    queryset = ContactPerson.objects.all()
    serializer_class = ContactPersonSerializer


def get_user_info(request):
    if request.user.is_authenticated:
        if request.user.is_superuser:
            all_permissions = Permission.objects.all()
        else:
            all_permissions = request.user.user_permissions.all() | Permission.objects.filter(group__user=request.user)
        data = {
            'username': request.user.username,
            'permissions': list(all_permissions.values_list('codename', flat=True)),
            'is_staff': request.user.is_staff,
        }
        return data
    else:
        return {'username': None, 'permissions': [], 'is_staff': False}


class LoginView(View):
    def post(self, request):
        data = loads(request.body)
        username = data.get('username')
        password = data.get('password')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return JsonResponse(get_user_info(request))
        else:
            return HttpResponse(status=401)


class LogoutView(View):
    def post(self, request):
        logout(request)
        return HttpResponse(status=200)


class UserView(View):
    def get(self, request):
        return JsonResponse(get_user_info(request))
