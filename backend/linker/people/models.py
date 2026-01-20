import secrets

from django.contrib.auth.models import User
from django.contrib.gis.measure import D
from django.db import connection, models
from django.db.models import OuterRef, Subquery
from enumfields import EnumField

from linker.map.models import Basis, Fiche, ForbiddenArea, Tocht, Weide
from linker.people.constants import Direction, MemberType
from linker.tracing.constants import FICHE_MAX_DISTANCE, GEBIED_MAX_DISTANCE, TOCHT_MAX_DISTANCE, WEIDE_MAX_DISTANCE
from linker.trackers.models import Position, Tracker


class LocationMixin:
    def with_last_location(self):
        return self.with_last_position_point().annotate(
            fiche=Subquery(
                Fiche.objects.filter(
                    point__distance_lte=(OuterRef('last_position_point'), D(m=FICHE_MAX_DISTANCE))
                ).values('pk')[:1]
            ),
            nearest_tocht=Subquery(
                Tocht.objects.filter(
                    route__distance_lte=(OuterRef('last_position_point'), D(m=TOCHT_MAX_DISTANCE))
                ).values('pk')[:1]
            ),
            weide=Subquery(
                Weide.objects.filter(
                    polygon__distance_lte=(OuterRef('last_position_point'), D(m=WEIDE_MAX_DISTANCE))
                ).values('pk')[:1]
            ),
            basis=Subquery(
                Basis.objects.filter(
                    point__distance_lte=(OuterRef('last_position_point'), D(m=WEIDE_MAX_DISTANCE))
                ).values('pk')[:1]
            ),
            forbidden_area=Subquery(
                ForbiddenArea.objects.filter(area__contains=OuterRef('last_position_point')).values('pk')[:1]
            ),
        )


class ContactPerson(models.Model):
    name = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=13, blank=True, null=True)
    email_address = models.CharField(max_length=100, blank=True, null=True)
    is_favorite = models.BooleanField(default=False)

    team = models.ForeignKey('Team', on_delete=models.CASCADE, related_name='contact_persons')

    def __str__(self) -> str:
        return f'{self.team.direction.value}{self.team.number:02d} {self.name}'


class OrganizationMemberQuerySet(LocationMixin, models.QuerySet):
    def with_last_position_point(self):
        return self.annotate(
            last_position_point=Subquery(
                Position.objects.filter(organization_member=OuterRef('pk')).order_by('-timestamp').values('point')[:1]
            ),
        )

    def with_last_position_timestamp(self):
        return self.annotate(
            last_position_timestamp=Subquery(
                Position.objects.filter(organization_member=OuterRef('pk'))
                .order_by('-timestamp')
                .values('timestamp')[:1]
            )
        )


class OrganizationMember(models.Model):
    tracker = models.OneToOneField(Tracker, on_delete=models.SET_NULL, blank=True, null=True)
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=5, help_text='De letters die op de kaart verschijnen')
    phone_number = models.CharField(max_length=13, blank=True)
    member_type = EnumField(MemberType, max_length=13)

    objects = OrganizationMemberQuerySet.as_manager()

    def __str__(self) -> str:
        return f'{self.member_type.value.title()} - {self.name}'

    def get_track_geojson(self) -> str:
        tocht_centroid = Tocht.centroid()
        tocht_centroid_ewkb = tocht_centroid.hexewkb.decode('utf-8') if tocht_centroid else None
        with connection.cursor() as cursor:
            cursor.execute(
                """SELECT ST_AsGeoJSON(ST_MakeLine(trackers_position.point ORDER BY trackers_position.timestamp))
                FROM trackers_position
                WHERE (
                    trackers_position.organization_member_id = %s
                    AND (%s IS NULL OR ST_DistanceSphere(trackers_position.point, %s::geometry) < %s)
                )""",
                [self.id, tocht_centroid_ewkb, tocht_centroid_ewkb, GEBIED_MAX_DISTANCE],
            )
            row = cursor.fetchone()
        return row[0]  # type: ignore[no-any-return]


class TeamQuerySet(LocationMixin, models.QuerySet):
    def with_last_position_point(self):
        return self.annotate(
            last_position_point=Subquery(
                Position.objects.filter(team=OuterRef('pk')).order_by('-timestamp').values('point')[:1]
            ),
        )

    def with_last_position_timestamp(self):
        return self.annotate(
            last_position_timestamp=Subquery(
                Position.objects.filter(team=OuterRef('pk')).order_by('-timestamp').values('timestamp')[:1]
            ),
        )


class Team(models.Model):
    direction = EnumField(Direction)
    number = models.PositiveIntegerField(unique=True)
    name = models.CharField(max_length=100)
    chiro = models.CharField(max_length=100)
    tracker = models.OneToOneField(Tracker, on_delete=models.SET_NULL, blank=True, null=True)

    safe_weide = models.CharField(max_length=64, blank=True)
    safe_weide_updated_at = models.DateTimeField(blank=True, null=True)
    safe_weide_updated_by = models.ForeignKey(User, blank=True, null=True, on_delete=models.SET_NULL)

    objects = TeamQuerySet.as_manager()

    class Meta:
        permissions = [
            ('view_stats', 'Can view team stats'),
            ('view_all_teams', 'Can view all teams'),
            ('view_team_details', 'Can view team details'),
            ('view_team_number', 'Can view team number'),
        ]

    def __str__(self) -> str:
        return f'{self.direction.value}{self.number:02d} {self.name}'

    def get_track_geojson(self) -> str:
        # TODO: team is safe filter
        tocht_centroid = Tocht.centroid()
        tocht_centroid_ewkb = tocht_centroid.hexewkb.decode('utf-8') if tocht_centroid else None
        with connection.cursor() as cursor:
            cursor.execute(
                """SELECT ST_AsGeoJSON(ST_MakeLine(trackers_position.point ORDER BY trackers_position.timestamp))
                FROM trackers_position
                WHERE (
                    trackers_position.team_id = %s
                    AND (%s IS NULL OR ST_DistanceSphere(trackers_position.point, %s::geometry) < %s)
                )""",
                [self.id, tocht_centroid_ewkb, tocht_centroid_ewkb, GEBIED_MAX_DISTANCE],
            )
            row = cursor.fetchone()
        return row[0]  # type: ignore[no-any-return]


class LoginToken(models.Model):
    token = models.CharField(max_length=64, unique=True, db_index=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='login_tokens')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f'LoginToken for {self.user.username}'

    @staticmethod
    def generate_token() -> str:
        return secrets.token_urlsafe(32)


class TeamNote(models.Model):
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='team_notes')
    created = models.DateTimeField(auto_now_add=True)
    text = models.TextField()
    author = models.ForeignKey(User, blank=True, null=True, on_delete=models.SET_NULL)

    def __str__(self) -> str:
        return f'{self.team}: {self.text}'
