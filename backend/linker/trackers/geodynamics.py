from datetime import datetime
from typing import Optional

from dateutil.parser import isoparse
from django.contrib.gis.geos import Point
from django.utils.timezone import now
from geopy.distance import distance

from linker.map.models import Tocht
from linker.people.models import Team
from linker.trackers.models import Tracker, TrackerLog


def import_geodynamics_data(data: dict, fetch_datetime: Optional[datetime] = None) -> None:
    if fetch_datetime is None:
        fetch_datetime = now()

    tocht_centroid = Tocht.centroid()

    new_tracker_logs = []
    trackers = {tracker.tracker_id: tracker for tracker in Tracker.objects.all()}
    safe_trackers = set(Team.objects.exclude(safe_weide__isnull=True).values_list('tracker__tracker_id', flat=True))

    for tracker_data in data['Data']:
        if tracker_data['LastLocation'] is None:
            continue
        last_location = tracker_data['LastLocation']

        tracker_id = tracker_data['Id']

        if tracker_id not in trackers:
            trackers[tracker_id] = Tracker.objects.create(tracker_id=tracker_id)

        tracker = trackers[tracker_id]
        point = Point(last_location['Longitude'], last_location['Latitude'])
        if distance(point, tocht_centroid).km > 50:
            continue

        new_tracker_logs.append(
            TrackerLog(
                tracker=tracker,
                gps_datetime=isoparse(last_location['GpsDateTime']),
                fetch_datetime=fetch_datetime,
                team_is_safe=tracker_id in safe_trackers,
                local_datetime=isoparse(last_location['LocalDateTime']) if last_location['LocalDateTime'] else None,
                last_sync_date=isoparse(tracker_data['LastSyncDate']) if tracker_data['LastSyncDate'] else None,
                satellites=last_location['Satellites'],
                input_acc=last_location['InputAcc'],
                voltage=last_location['VoltageString'],
                point=point,
                analog_input=last_location['AnalogInput1'],
                tracker_type=last_location['Type'],
                heading=last_location['Heading'],
                speed=last_location['Speed'],
                is_online=tracker_data['IsOnline'],
                has_gps=tracker_data['HasGps'],
                has_power=tracker_data['HasPower'],
                is_online_threshold=tracker_data['IsOnlineTreshold'],
                name=tracker_data['Name'],
                code=tracker_data['Code'],
            )
        )

    TrackerLog.objects.bulk_create(new_tracker_logs, ignore_conflicts=True)
