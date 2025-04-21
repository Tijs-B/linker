from datetime import datetime, timedelta
from logging import getLogger
from time import time
from zoneinfo import ZoneInfo

import requests
from dateutil.parser import isoparse
from django.conf import settings
from django.contrib.gis.geos import Point
from django.db.models import OuterRef, Subquery
from django.utils.timezone import now

from linker.config.models import Setting
from linker.people.models import Team
from linker.trackers.constants import SETTING_GEODYNAMICS_API_HISTORY_SECONDS, TrackerLogSource
from linker.trackers.models import Tracker, TrackerLog

logger = getLogger(__name__)


def try_parse_date(date_str: str | None) -> datetime | None:
    if date_str is None:
        return None
    try:
        return isoparse(date_str)
    except Exception:
        return None


def post_import_actions() -> None:
    subquery = TrackerLog.objects.filter(tracker=OuterRef('pk')).order_by('-gps_datetime')
    trackers_updated = Tracker.objects.update(last_log_id=Subquery(subquery.values('id')[:1]))
    logger.info(f'Updated last log of {trackers_updated} trackers')


def import_geodynamics_minisite_data(data: dict, fetch_datetime: datetime | None = None) -> None:
    if fetch_datetime is None:
        fetch_datetime = now()

    # tocht_centroid = Tocht.centroid()

    new_tracker_logs = []
    trackers = {tracker.tracker_id: tracker for tracker in Tracker.objects.all()}
    safe_trackers = set(Team.objects.exclude(safe_weide='').values_list('tracker__tracker_id', flat=True))

    for tracker_data in data['Data']:
        tracker_id = tracker_data['Id']
        tracker_name = tracker_data['Name']

        if tracker_id not in trackers:
            logger.info(f'Tracker id {tracker_id} not yet in tracker list. Creating new tracker')
            trackers[tracker_id] = Tracker.objects.create(tracker_id=tracker_id, tracker_name=tracker_name)

        tracker = trackers[tracker_id]

        if tracker_data.get('LastLocation') is None:
            continue
        last_location = tracker_data['LastLocation']

        gps_datetime = try_parse_date(last_location.get('GpsDateTime'))
        if gps_datetime is None:
            logger.info(
                f'GPS datetime is None or can not be parsed. Skipping adding log. {last_location.get("GpsDateTime")}'
            )
            continue

        point = Point(round(last_location['Longitude'], 6), round(last_location['Latitude'], 6))
        # if distance(point, tocht_centroid).km > 50:
        #     logger.info('Location too far away from tocht. Skipping adding log')
        #     continue

        new_tracker_logs.append(
            TrackerLog(
                tracker=tracker,
                gps_datetime=gps_datetime,
                source=TrackerLogSource.MINISITE_API,
                fetch_datetime=fetch_datetime,
                team_is_safe=tracker_id in safe_trackers,
                local_datetime=try_parse_date(last_location.get('LocalDateTime')),
                last_sync_date=try_parse_date(tracker_data.get('LastSyncDate')),
                satellites=last_location.get('Satellites'),
                point=point,
                analog_input=last_location.get('AnalogInput1'),
                tracker_type=last_location.get('Type'),
                heading=last_location.get('Heading'),
                speed=last_location.get('Speed'),
                has_gps=tracker_data.get('HasGps'),
                has_power=tracker_data.get('HasPower'),
            )
        )

    result = TrackerLog.objects.bulk_create(new_tracker_logs, ignore_conflicts=True)
    logger.info(f'Created {len(result)} tracker logs')

    post_import_actions()


def fetch_geodynamics_minisite_data():
    url = settings.GEODYNAMICS_MINISITE_URL
    if url is None:
        logger.warning('GEODYNAMICS_MINISITE_URL is not configured in the settings')
        return
    logger.info('Fetching tracker data from geodynamics minisite...')
    response = requests.get(
        url, params={'_': round(time() * 1000)}, headers={'User-Agent': 'https://github.com/Tijs-B/linker'}
    )
    logger.info(f'Geodynamics minisite status {response.status_code}, length {len(response.content)}')

    import_geodynamics_minisite_data(data=response.json())


def import_geodynamics_api_data(data: list) -> None:
    new_tracker_logs = []
    trackers = {tracker.tracker_id: tracker for tracker in Tracker.objects.all()}

    for item in data:
        tracker_id = item['ResourceId']

        if tracker_id not in trackers:
            logger.warning(f'Tracker with id {tracker_id} not found')
            continue

        tracker = trackers[tracker_id]

        for position in item['Positions']:
            gps_datetime = try_parse_date(position.get('GpsDateTime'))
            if gps_datetime is None:
                continue
            point = Point(round(position['Longitude'], 6), round(position['Latitude'], 6))
            new_tracker_logs.append(
                TrackerLog(
                    tracker=tracker,
                    tracker_type=position.get('Type'),
                    source=TrackerLogSource.GEODYNAMICS_API,
                    local_datetime=try_parse_date(position.get('RtcDateTime')),
                    gps_datetime=gps_datetime,
                    speed=position.get('Speed'),
                    heading=position.get('Heading'),
                    point=point,
                    satellites=position.get('Satellites'),
                )
            )

    result = TrackerLog.objects.bulk_create(new_tracker_logs, ignore_conflicts=True)
    logger.info(f'Created {len(result)} tracker logs')

    post_import_actions()


def fetch_geodynamics_api_data():
    auth = settings.GEODYNAMICS_API_AUTH
    base_url = settings.GEODYNAMICS_API_BASE_URL
    if base_url is None:
        logger.warning('GEODYNAMICS_API_BASE_URL is not configured in the settings')
        return

    url = base_url.rstrip('/') + '/api/v1/location/position'

    history_seconds = float(Setting.get_value_for_key(SETTING_GEODYNAMICS_API_HISTORY_SECONDS, default='300'))
    from_ts = (now() - timedelta(seconds=history_seconds)).astimezone(ZoneInfo('UTC')).isoformat()
    to_ts = (now() + timedelta(seconds=5)).astimezone(ZoneInfo('UTC')).isoformat()
    params = {'from': from_ts, 'to': to_ts}

    tracker_ids = list(Tracker.objects.values_list('tracker_id', flat=True))

    logger.info(f'Fetching tracker data from geodynamics API... range {from_ts} - {to_ts}')
    response = requests.post(url, params=params, json=tracker_ids, auth=auth)
    logger.info(f'Geodynamics api status {response.status_code}, length {len(response.content)}')

    import_geodynamics_api_data(data=response.json())
