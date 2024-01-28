from datetime import datetime
from typing import Optional

from django.contrib.gis.geos import Point
from django.utils.timezone import now
from geopy.distance import distance

from linker.map.models import Tocht
from linker.trackers.models import Tracker, TrackerLog


def import_geodynamics_data(data: dict, update_metadata: bool = True, fetch_datetime: Optional[datetime] = None):
    if fetch_datetime is None:
        fetch_datetime = now()

    tocht_centroid = Tocht.centroid()

    for tracker_data in data["Data"]:
        if tracker_data["LastLocation"] is None:
            continue
        last_location = tracker_data["LastLocation"]
        tracker = Tracker.objects.get_or_create(tracker_id=tracker_data["Id"])[0]

        last_sync_date = datetime.fromisoformat(tracker_data["LastSyncDate"]) \
            if tracker_data["LastSyncDate"] else None
        local_datetime = datetime.fromisoformat(last_location["LocalDateTime"]) \
            if last_location["LocalDateTime"] else None
        gps_datetime = datetime.fromisoformat(last_location["GpsDateTime"])

        if TrackerLog.objects.filter(tracker=tracker, gps_datetime=gps_datetime).exists():
            continue

        point = Point(last_location["Longitude"], last_location["Latitude"])

        if distance(point, tocht_centroid).km > 50:
            continue

        tracker_log = TrackerLog.objects.create(
            tracker=tracker,
            gps_datetime=gps_datetime,
            fetch_datetime=fetch_datetime,
            local_datetime=local_datetime,
            last_sync_date=last_sync_date,
            satellites=last_location["Satellites"],
            input_acc=last_location["InputAcc"],
            voltage=last_location["VoltageString"],
            point=point,
            analog_input=last_location["AnalogInput1"],
            tracker_type=last_location["Type"],
            heading=last_location["Heading"],
            speed=last_location["Speed"],
            is_online=tracker_data["IsOnline"],
            has_gps=tracker_data["HasGps"],
            has_power=tracker_data["HasPower"],
            is_online_threshold=tracker_data["IsOnlineTreshold"],
            name=tracker_data["Name"],
            code=tracker_data["Code"],
        )

        if update_metadata:
            tracker.last_log = tracker_log
            tracker.save()
