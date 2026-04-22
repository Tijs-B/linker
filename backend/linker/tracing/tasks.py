from datetime import timedelta
from logging import getLogger

from celery import shared_task
from django.contrib.gis.measure import D
from django.db.models import Exists, OuterRef, Q, Subquery
from django.utils.timezone import now

from linker.config.models import Switch
from linker.map.models import ForbiddenArea, Tocht
from linker.people.models import Team, TeamSafetyLog
from linker.tracing.constants import (
    SWITCH_TRACE_TEAMS,
    TRACKER_FAR_AWAY_METERS,
    TRACKER_FORBIDDEN_AREA_AWAY_FROM_ROUTE_METERS,
    NotificationType,
)
from linker.tracing.models import Notification
from linker.tracing.utils import trace_team
from linker.trackers.constants import TRACKER_LOG_BATTERY_LOW_TYPES, TRACKER_LOG_SOS_TYPES, TRACKER_OFFLINE_MINUTES
from linker.trackers.models import Position, Tracker, TrackerLog

logger = getLogger(__name__)


@shared_task
def trace_teams() -> None:
    if Switch.switch_is_active(SWITCH_TRACE_TEAMS):
        logger.info('Starting tracing teams')
        for team in Team.objects.all():
            trace_team(team)


@shared_task
def tracker_offline_notifications() -> None:
    # Find offline trackers
    cutoff = now() - timedelta(minutes=TRACKER_OFFLINE_MINUTES)
    offline_trackers = Tracker.objects.filter(
        team__isnull=False,
        team__in=Team.objects.with_last_safety_location().filter(
            Q(last_safety_location='') | Q(last_safety_location__isnull=True)
        ),
    ).filter(Q(last_log__isnull=True) | Q(last_log__gps_datetime__lte=cutoff))

    # Add notifications for offline trackers
    for tracker in offline_trackers:
        Notification.objects.get_or_create(notification_type=NotificationType.TRACKER_OFFLINE, tracker=tracker)

    # Delete notifications for online trackers
    Notification.objects.filter(
        notification_type=NotificationType.TRACKER_OFFLINE,
        tracker__last_log__isnull=False,
        tracker__last_log__gps_datetime__gte=cutoff,
    ).delete()


@shared_task
def tracker_sos_notifications() -> None:
    sos_logs = TrackerLog.objects.filter(tracker_type__in=TRACKER_LOG_SOS_TYPES)
    for sos_log in sos_logs:
        if Notification.objects.filter(
            sent__gte=sos_log.gps_datetime, notification_type=NotificationType.TRACKER_SOS, tracker=sos_log.tracker
        ).exists():
            continue
        Notification.objects.create(notification_type=NotificationType.TRACKER_SOS, tracker=sos_log.tracker, severity=1)


@shared_task
def tracker_battery_notifications() -> None:
    cutoff = now() - timedelta(hours=3)
    tracker_ids = list(
        Tracker.objects.filter(
            Exists(
                TrackerLog.objects.filter(
                    tracker=OuterRef('pk'), tracker_type__in=TRACKER_LOG_BATTERY_LOW_TYPES, gps_datetime__gte=cutoff
                )
            )
        ).values_list('pk', flat=True)
    )

    for tracker_id in tracker_ids:
        Notification.objects.get_or_create(
            notification_type=NotificationType.TRACKER_LOW_BATTERY, tracker_id=tracker_id
        )


@shared_task
def tracker_far_away_notifications() -> None:
    safety_location_subquery = Subquery(
        TeamSafetyLog.objects.filter(
            team=OuterRef('team'),
            created__lte=OuterRef('timestamp'),
        )
        .order_by('-created')
        .values('location')[:1]
    )
    teams_far_away = (
        Position.objects.annotate(team_safe_at_time=safety_location_subquery)
        .filter(
            ~Exists(Tocht.objects.filter(route__distance_lte=(OuterRef('point'), D(m=TRACKER_FAR_AWAY_METERS)))),
            Q(team_safe_at_time='') | Q(team_safe_at_time__isnull=True),
            timestamp__gte=now() - timedelta(minutes=10),
            team__isnull=False,
        )
        .values_list('team_id', flat=True)
    )

    for team_id in teams_far_away:
        Notification.objects.get_or_create(notification_type=NotificationType.TRACKER_FAR_AWAY, team_id=team_id)

    # Delete notifications not in this list
    Notification.objects.filter(notification_type=NotificationType.TRACKER_FAR_AWAY).exclude(
        team_id__in=teams_far_away
    ).delete()


@shared_task
def tracker_forbidden_area_notifications() -> None:
    in_forbidden_area_route_not_allowed = Exists(
        ForbiddenArea.objects.filter(route_allowed=False, area__contains=OuterRef('point'))
    )
    in_forbidden_area_route_allowed = Exists(
        ForbiddenArea.objects.filter(route_allowed=True, area__contains=OuterRef('point'))
    )
    close_to_route = Exists(
        Tocht.objects.filter(
            route__distance_lte=(OuterRef('point'), D(m=TRACKER_FORBIDDEN_AREA_AWAY_FROM_ROUTE_METERS))
        )
    )

    safety_location_subquery = Subquery(
        TeamSafetyLog.objects.filter(
            team=OuterRef('team'),
            created__lte=OuterRef('timestamp'),
        )
        .order_by('-created')
        .values('location')[:1]
    )
    team_ids = set(
        Position.objects.annotate(team_safe_at_time=safety_location_subquery)
        .filter(
            in_forbidden_area_route_not_allowed | (in_forbidden_area_route_allowed & ~close_to_route),
            Q(team_safe_at_time='') | Q(team_safe_at_time__isnull=True),
            team__isnull=False,
        )
        .values_list('team_id', flat=True)
        .distinct()
    )

    for team_id in team_ids:
        Notification.objects.get_or_create(
            notification_type=NotificationType.TRACKER_IN_FORBIDDEN_AREA, team_id=team_id, severity=1
        )

    # Delete notifications not in this list
    Notification.objects.filter(
        team__isnull=False, notification_type=NotificationType.TRACKER_IN_FORBIDDEN_AREA
    ).exclude(team_id__in=team_ids).delete()
