from enum import Enum

FICHE_MAX_DISTANCE = 100
TOCHT_MAX_DISTANCE = 60
WEIDE_MAX_DISTANCE = 100
GEBIED_MAX_DISTANCE = 50  # in km
SKIP_BASIS_DISTANCE = 50

SWITCH_TRACE_TEAMS = 'trace_teams'


class CheckpointLogType(Enum):
    AUTOMATED = 'automated'
