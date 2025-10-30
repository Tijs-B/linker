# type: ignore
import datetime
import gzip
import json
import zoneinfo
from pathlib import Path

from dateutil.parser import isoparse
from django.conf import settings
from django.utils.timezone import now

from linker.config.models import Setting
from linker.people.models import OrganizationMember, Team
from linker.tracing.models import CheckpointLog
from linker.utils import import_gpkg, import_groepen_en_deelnemers, import_organization_members

from .constants import SETTING_SIMULATION_START
from .geodynamics import import_geodynamics_minisite_data
from .models import Tracker, TrackerLog

SIMULATION_START = datetime.datetime(year=2023, month=4, day=29, hour=12, tzinfo=zoneinfo.ZoneInfo('Europe/Brussels'))


def restart_simulation() -> None:
    timestamp = now()
    TrackerLog.objects.filter(fetch_datetime__gt=SIMULATION_START).delete()
    CheckpointLog.objects.filter(arrived__gt=SIMULATION_START).delete()
    for tracker in Tracker.objects.all():
        tracker.last_log = tracker.tracker_logs.latest('gps_datetime')
        tracker.save()
    Setting.objects.update_or_create(key=SETTING_SIMULATION_START, defaults={'value': timestamp.isoformat()})


def _get_timestamp_from_file_name(file: Path) -> datetime.datetime:
    return datetime.datetime(1970, 1, 1, tzinfo=zoneinfo.ZoneInfo('UTC')) + datetime.timedelta(
        seconds=(int(file.name.replace('.json.gz', '')))
    )


def simulate_download_tracker_data(until: datetime.datetime | None = None) -> None:
    if until is None:
        try:
            start_timestamp_str = Setting.get_value_for_key(SETTING_SIMULATION_START)
            start_timestamp = isoparse(start_timestamp_str)
            until = SIMULATION_START + (now() - start_timestamp)
        except KeyError:
            until = SIMULATION_START

    files_to_do = list((Path(settings.SIMULATION_PATH) / 'geodynamics').glob('*.json.gz'))
    try:
        latest_datetime = TrackerLog.objects.latest('fetch_datetime').fetch_datetime
        files_to_do = [
            filename for filename in files_to_do if latest_datetime < _get_timestamp_from_file_name(filename)
        ]
    except TrackerLog.DoesNotExist:
        pass

    files_to_do = [filename for filename in files_to_do if _get_timestamp_from_file_name(filename) <= until]
    files_to_do.sort(key=lambda filename: filename.name)

    for filename in files_to_do:
        with gzip.open(filename, 'rb') as file:
            data = json.load(file)
        import_geodynamics_minisite_data(data, _get_timestamp_from_file_name(filename))

    for tracker in Tracker.objects.all():
        tracker.last_log = tracker.tracker_logs.latest('gps_datetime')
        tracker.save()


def couple_trackers() -> None:
    for tracker in Tracker.objects.all():
        if hasattr(tracker, 'team'):
            continue
        code = tracker.last_log.code
        if code.startswith('RK'):
            continue
        if code[0] != 'R' and code[0] != 'B':
            continue
        team_id = int(code[1:])
        team = Team.objects.get(number=team_id)
        team.tracker = tracker
        team.save()

    for tracker in Tracker.objects.all():
        if hasattr(tracker, 'team'):
            continue
        code = tracker.last_log.code
        if len(code) == 0 or not code.isnumeric():
            continue
        team_id = int(code)
        team = Team.objects.filter(number=team_id).first()
        if team and team.tracker is None:
            team.tracker = tracker
            team.save()

    for tracker in Tracker.objects.all():
        code = tracker.last_log.code
        member = OrganizationMember.objects.filter(code=code).first()
        if member is not None:
            member.tracker = tracker
            member.save()


def import_all() -> None:
    simulation_path = Path(settings.SIMULATION_PATH)
    import_gpkg(simulation_path / 'Link 2023.gpkg')
    import_organization_members(simulation_path / 'organization_members.csv')
    import_groepen_en_deelnemers(simulation_path / 'GroepenEnDeelnemers2023.xlsx')
    simulate_download_tracker_data()
    couple_trackers()
