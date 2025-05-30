from enum import Enum

SETTING_SIMULATION_START = 'simulation_start'
SETTING_GEODYNAMICS_API_HISTORY_SECONDS = 'geodynamics_api_history_seconds'

SWITCH_SIMULATE = 'simulate'
SWITCH_FETCH_TRACKERS_MINISITE = 'fetch_trackers_minisite'
SWITCH_FETCH_TRACKERS_API = 'fetch_trackers_api'
SWITCH_EXCLUDE_BASIS_FROM_TRACK = 'exclude_basis_from_track'

TRACKER_OFFLINE_MINUTES = 12

TRACKER_LOG_BATTERY_LOW_TYPES = [1000, 1001, 1002]
TRACKER_LOG_SOS_TYPES = [17006, 200]
TRACKER_VOLTAGE_RANGE = (3.65, 4.2)


class TrackerLogSource(Enum):
    MINISITE_API = 'minisite_api'
    GEODYNAMICS_API = 'geodynamics_api'
    MANUAL = 'manual'

    def __str__(self) -> str:
        return self.value
