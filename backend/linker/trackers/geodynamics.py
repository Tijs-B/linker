from datetime import datetime
from logging import getLogger
from time import time
from typing import Optional

import requests
from dateutil.parser import isoparse
from django.conf import settings
from django.contrib.gis.geos import Point
from django.db.models import OuterRef, Subquery
from django.utils.timezone import now

from linker.people.models import Team
from linker.trackers.models import Tracker, TrackerLog


logger = getLogger(__name__)


def try_parse_date(date_str: str) -> datetime | None:
    try:
        return isoparse(date_str)
    except Exception:
        return None


def import_geodynamics_data(data: dict, fetch_datetime: Optional[datetime] = None) -> None:
    if fetch_datetime is None:
        fetch_datetime = now()

    # tocht_centroid = Tocht.centroid()

    new_tracker_logs = []
    trackers = {tracker.tracker_id: tracker for tracker in Tracker.objects.all()}
    safe_trackers = set(Team.objects.exclude(safe_weide__isnull=True).values_list('tracker__tracker_id', flat=True))

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
                fetch_datetime=fetch_datetime,
                team_is_safe=tracker_id in safe_trackers,
                local_datetime=try_parse_date(last_location.get('LocalDateTime')),
                last_sync_date=try_parse_date(last_location.get('LastSyncDate')),
                satellites=last_location.get('Satellites'),
                input_acc=last_location.get('InputAcc'),
                voltage=last_location.get('VoltageString'),
                point=point,
                analog_input=last_location.get('AnalogInput1'),
                tracker_type=last_location.get('Type'),
                heading=last_location.get('Heading'),
                speed=last_location.get('Speed'),
                is_online=tracker_data.get('IsOnline'),
                has_gps=tracker_data.get('HasGps'),
                has_power=tracker_data.get('HasPower'),
                is_online_threshold=tracker_data.get('IsOnlineTreshold'),
                name=tracker_data.get('Name'),
                code=tracker_data.get('Code'),
            )
        )

    result = TrackerLog.objects.bulk_create(new_tracker_logs, ignore_conflicts=True)
    logger.info(f'Created {len(result)} tracker logs')

    subquery = TrackerLog.objects.filter(tracker=OuterRef('pk')).order_by('-gps_datetime')
    trackers_updated = Tracker.objects.update(last_log_id=Subquery(subquery.values('id')[:1]))
    logger.info(f'Updated last lof of {trackers_updated} trackers')


def fetch_geodynamics_data():
    url = settings.GEODYNAMICS_URL
    if url is None:
        logger.warning('Geodynamics URL is not configured in the settings')
    logger.info('Fetching tracker data from geodynamics...')
    response = requests.get(
        url, params={'_': round(time() * 1000)}, headers={'User-Agent': 'https://github.com/Tijs-B/linker'}
    )
    logger.info(f'Geodynamics status code {response.status_code}')

    import_geodynamics_data(data=response.json())
