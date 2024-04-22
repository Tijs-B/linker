from datetime import timedelta
from logging import getLogger

from django.contrib.gis.measure import D
from django.db.models import Subquery, OuterRef, Q

from linker.map.models import Fiche
from linker.people.models import Team
from linker.tracing.constants import FICHE_MAX_DISTANCE
from linker.tracing.models import CheckpointLog
from linker.trackers.models import TrackerLog


logger = getLogger(__name__)


def trace_team(team: Team):
    logger.info(f'Tracing team {team}')
    closest_fiche = Subquery(
        Fiche.objects.filter(point__distance_lte=(OuterRef('point'), D(m=FICHE_MAX_DISTANCE))).values('pk')[:1]
    )

    logs = TrackerLog.objects.filter(tracker__team=team, team_is_safe=False)
    last_checkpoint = team.checkpointlogs.order_by('-left').first()
    if last_checkpoint is not None:
        logs = logs.filter(gps_datetime__gte=last_checkpoint.arrived)

    logs = logs.annotate(closest_fiche=closest_fiche).order_by('gps_datetime').values('gps_datetime', 'closest_fiche')

    if not logs.exists():
        return

    current_fiche = logs[0]['closest_fiche']
    current_arrived = logs[0]['gps_datetime']
    current_left = logs[0]['gps_datetime']
    for log in logs:
        if log['closest_fiche'] != current_fiche:
            if current_fiche is not None:
                matching = (
                    CheckpointLog.objects.filter(team=team, fiche_id=current_fiche, arrived__lte=current_left)
                    .filter(Q(left=None) | Q(left__gte=current_arrived - timedelta(minutes=5)))
                    .first()
                )
                if matching is not None:
                    new_left = max(current_left, matching.left) if matching.left is not None else current_left
                    logger.info(f'Updating existing checkpointlog {matching} with new left {new_left}')
                    matching.left = new_left
                    matching.save()
                else:
                    logger.info(f'Creating new checkpointlog {current_arrived}-{current_left} at {current_fiche}')
                    CheckpointLog.objects.create(
                        arrived=current_arrived,
                        left=current_left,
                        fiche_id=current_fiche,
                        team=team,
                    )
            current_arrived = log['gps_datetime']
            current_left = log['gps_datetime']
            current_fiche = log['closest_fiche']
        else:
            current_left = log['gps_datetime']
    if current_fiche is not None:
        if (
            CheckpointLog.objects.filter(team=team, fiche_id=current_fiche)
            .filter(Q(left=None) | Q(left__gte=current_arrived))
            .exists()
        ):
            logger.info(f'Creating new checkpointlog {current_arrived}-{current_left} at {current_fiche}')
            CheckpointLog.objects.create(
                arrived=current_arrived,
                left=current_left,
                fiche_id=current_fiche,
                team=team,
            )
