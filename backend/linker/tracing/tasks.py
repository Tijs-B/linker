from datetime import timedelta
from logging import getLogger

from celery import shared_task
from django.contrib.gis.db.models import Collect
from django.contrib.gis.db.models.functions import Centroid
from django.contrib.gis.measure import D
from django.db.models import Q, Exists, OuterRef
from django.utils.timezone import now

from linker.config.models import Switch
from linker.map.models import Tocht, ForbiddenArea
from linker.people.models import Team
from linker.tracing.constants import (
    SWITCH_TRACE_TEAMS,
    NotificationType,
    TRACKER_LOG_SOS_TYPES,
    TRACKER_LOG_BATTERY_LOW_TYPES,
    TRACKER_NOT_MOVING_MINUTES,
    TRACKER_FAR_AWAY_METERS,
    TRACKER_NOT_MOVING_METERS,
)
from linker.tracing.models import Notification
from linker.tracing.utils import trace_team
from linker.trackers.constants import TRACKER_OFFLINE_MINUTES
from linker.trackers.models import Tracker, TrackerLog

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
    offline_trackers = Tracker.objects.filter(team__isnull=False, team__safe_weide='').filter(
        Q(last_log__isnull=True) | Q(last_log__gps_datetime__lte=cutoff)
    )

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
    trackers_far_away = list(
        Tracker.objects.annotate(
            far_away=~Exists(
                Tocht.objects.filter(route__distance_lte=(OuterRef('last_log__point'), D(m=TRACKER_FAR_AWAY_METERS)))
            )
        )
        .filter(far_away=True, team__isnull=False, team__safe_weide='')
        .values_list('pk', flat=True)
    )
    for tracker in trackers_far_away:
        Notification.objects.get_or_create(notification_type=NotificationType.TRACKER_FAR_AWAY, tracker_id=tracker)

    # Delete notifications not in this list
    Notification.objects.filter(notification_type=NotificationType.TRACKER_FAR_AWAY).exclude(
        tracker_id__in=trackers_far_away
    ).delete()


@shared_task
def tracker_not_moving_notifications() -> None:
    cutoff = now() - timedelta(minutes=TRACKER_NOT_MOVING_MINUTES)
    minimum_log_count = TRACKER_NOT_MOVING_MINUTES // 5

    # iterate these trackers
    for tracker in Tracker.objects.filter(team__isnull=False, team__safe_weide=''):
        # Get the tracker logs in the time window
        tracker_logs = tracker.tracker_logs.filter(gps_datetime__gte=cutoff)

        # If the number of logs is too low, remove the notification
        if tracker_logs.count() < minimum_log_count:
            Notification.objects.filter(notification_type=NotificationType.TRACKER_NOT_MOVING, tracker=tracker).delete()
            continue

        # Find the centroid
        centroid = tracker_logs.aggregate(centroid=Centroid(Collect('point')))['centroid']

        # Check if all tracker logs are within TRACKER_NOT_MOVING_METERS from the centroid
        any_further = tracker_logs.filter(point__distance_gte=(centroid, D(M=TRACKER_NOT_MOVING_METERS))).exists()

        if not any_further:
            Notification.objects.get_or_create(notification_type=NotificationType.TRACKER_NOT_MOVING, tracker=tracker)
        else:
            Notification.objects.filter(notification_type=NotificationType.TRACKER_NOT_MOVING, tracker=tracker).delete()


@shared_task
def tracker_forbidden_area_notifications() -> None:
    tracker_ids = list(
        Tracker.objects.filter(team__isnull=False, team__safe_weide='', last_log__isnull=False)
        .filter(Exists(ForbiddenArea.objects.filter(area__contains=OuterRef('last_log__point'))))
        .values_list('pk', flat=True)
    )

    for tracker in tracker_ids:
        Notification.objects.get_or_create(
            notification_type=NotificationType.TRACKER_IN_FORBIDDEN_AREA, tracker_id=tracker, severity=1
        )

    # Delete notifications not in this list
    Notification.objects.filter(notification_type=NotificationType.TRACKER_IN_FORBIDDEN_AREA).exclude(
        tracker_id__in=tracker_ids
    ).delete()
