from json import loads
from logging import getLogger
from typing import Any

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import Permission
from django.contrib.gis.measure import D
from django.db.models import Prefetch, Q
from django.db.models.query import QuerySet
from django.http import HttpRequest, HttpResponse, JsonResponse
from django.views import View
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.serializers import BaseSerializer, Serializer

from linker.map.models import Tocht
from linker.tracing.constants import GEBIED_MAX_DISTANCE
from linker.trackers.permissions import CanViewPositions

from .models import ContactPerson, LoginToken, OrganizationMember, Team, TeamNote
from .serializers import (
    BasicTeamSerializer,
    ContactPersonSerializer,
    OrganizationMemberSerializer,
    TeamNoteSerializer,
    TeamSerializer,
    TeamWithNumberSerializer,
)

logger = getLogger(__name__)


def positions_response(queryset) -> HttpResponse:
    tocht_centroid = Tocht.centroid()
    queryset = queryset.filter(point__distance_lt=(tocht_centroid, D(m=GEBIED_MAX_DISTANCE)))
    queryset = queryset.order_by('timestamp')

    response = '['
    for item in queryset.values('id', 'timestamp', 'point', 'source', 'team_id', 'organization_member_id'):
        team_id = item['team_id'] if item['team_id'] else 'null'
        organization_member_id = item['organization_member_id'] if item['organization_member_id'] else 'null'
        response += (
            f'{{"id":{item["id"]},"timestamp":"{item["timestamp"].isoformat()}",'
            f'"point":{item["point"].json},"source":"{item["source"].value}",'
            f'"team_id":{team_id}, "organization_member_id":{organization_member_id}}},'
        )
    if response[-1] == ',':
        response = response[:-1]
    response = response + ']'

    return HttpResponse(response, content_type='application/json')


class TeamViewSet(viewsets.ModelViewSet[Team]):
    def get_serializer_class(self) -> type[Serializer[Team]]:
        if self.request.user.has_perm('people.view_team_details') and self.request.user.has_perm(
            'people.view_team_number'
        ):
            logger.info('YEAH BOI')
            return TeamSerializer
        elif self.request.user.has_perm('people.view_team_number'):
            return TeamWithNumberSerializer
        return BasicTeamSerializer

    def get_queryset(self) -> QuerySet[Team]:
        if self.request.user.has_perm('people.view_contactperson'):
            contact_person_inner_queryset = ContactPerson.objects.order_by('-is_favorite', 'name')
        else:
            contact_person_inner_queryset = ContactPerson.objects.none()

        if self.request.user.has_perm('people.view_teamnote'):
            team_note_inner_queryset = TeamNote.objects.order_by('created').select_related('author')
        else:
            team_note_inner_queryset = TeamNote.objects.none()

        queryset = (
            Team.objects.prefetch_related(
                Prefetch('team_notes', queryset=team_note_inner_queryset),
                Prefetch('contact_persons', queryset=contact_person_inner_queryset),
            )
            .with_last_safety_location()
            .with_last_location()
            .with_last_position_timestamp()
            .order_by('number')
        )

        if not self.request.user.has_perm('people.view_all_teams'):
            queryset = queryset.filter(Q(last_safety_location='') | Q(last_safety_location__isnull=True))

        return queryset

    def perform_update(self, serializer: BaseSerializer[Team]) -> None:
        location = serializer.validated_data.pop('last_safety_location', None)
        team = serializer.save()
        if location is not None:
            team.team_safety_logs.create(created_by=self.request.user, location=location)

    @action(detail=True, methods=['get'], permission_classes=(IsAuthenticated, CanViewPositions))
    def track(self, request: HttpRequest, pk: int | None = None) -> HttpResponse:
        return HttpResponse(self.get_object().get_track_geojson(), content_type='application/geo+json')

    @action(detail=True, methods=['get'], permission_classes=(IsAuthenticated, CanViewPositions))
    def positions(self, request: HttpRequest, pk: int | None = None) -> HttpResponse:
        return positions_response(self.get_object().positions)


class OrganizationMemberViewSet(viewsets.ReadOnlyModelViewSet[OrganizationMember]):
    queryset = OrganizationMember.objects.order_by('member_type', 'name')
    serializer_class = OrganizationMemberSerializer

    def get_queryset(self):
        return (
            OrganizationMember.objects.order_by('member_type', 'name')
            .with_last_location()
            .with_last_position_timestamp()
        )

    @action(detail=True, methods=['get'], permission_classes=(IsAuthenticated, CanViewPositions))
    def track(self, request: HttpRequest, pk: int | None = None) -> HttpResponse:
        return HttpResponse(self.get_object().get_track_geojson(), content_type='application/geo+json')

    @action(detail=True, methods=['get'], permission_classes=(IsAuthenticated, CanViewPositions))
    def positions(self, request: HttpRequest, pk: int | None = None) -> HttpResponse:
        return positions_response(self.get_object().positions)


class TeamNoteViewSet(viewsets.ModelViewSet[TeamNote]):
    queryset = TeamNote.objects.all().select_related('author')
    serializer_class = TeamNoteSerializer

    def perform_create(self, serializer: BaseSerializer[TeamNote]) -> None:
        serializer.save(author=self.request.user)


class ContactPersonViewSet(viewsets.ModelViewSet[ContactPerson]):
    queryset = ContactPerson.objects.all()
    serializer_class = ContactPersonSerializer


def get_user_info(request: HttpRequest) -> dict[str, Any]:
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
    def post(self, request: HttpRequest) -> HttpResponse:
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
    def post(self, request: HttpRequest) -> HttpResponse:
        logout(request)
        return HttpResponse(status=200)


class TokenLoginView(View):
    def post(self, request: HttpRequest) -> HttpResponse:
        data = loads(request.body)
        token_value = data.get('token')
        if not token_value:
            return HttpResponse(status=400)
        try:
            token = LoginToken.objects.select_related('user').get(token=token_value)
        except LoginToken.DoesNotExist:
            return HttpResponse(status=401)
        login(request, token.user, backend='django.contrib.auth.backends.ModelBackend')
        return JsonResponse(get_user_info(request))


class UserView(View):
    def get(self, request: HttpRequest) -> JsonResponse:
        return JsonResponse(get_user_info(request))
