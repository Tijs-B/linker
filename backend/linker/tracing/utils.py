from datetime import timedelta
from logging import getLogger

from django.contrib.gis.measure import D
from django.db.models import OuterRef, Q, Subquery

from linker.map.models import Fiche
from linker.people.models import Team, TeamSafetyLog
from linker.tracing.constants import FICHE_MAX_DISTANCE
from linker.tracing.models import CheckpointLog
from linker.trackers.models import Position

logger = getLogger(__name__)


def trace_team(team: Team) -> None:
    logger.info(f'Tracing team {team}')
    closest_fiche = Subquery(
        Fiche.objects.filter(
            tocht__is_alternative=False, point__distance_lte=(OuterRef('point'), D(m=FICHE_MAX_DISTANCE))
        ).values('pk')[:1]
    )

    positions = (
        Position.objects.filter(team=team)
        .annotate(
            team_safe_at_time=Subquery(
                TeamSafetyLog.objects.filter(
                    team=team,
                    created__lte=OuterRef('timestamp'),
                )
                .order_by('-created')
                .values('location')[:1]
            )
        )
        .filter(Q(team_safe_at_time='') | Q(team_safe_at_time__isnull=True))
    )
    try:
        last_checkpoint = team.checkpointlogs.latest('left')
    except CheckpointLog.DoesNotExist:
        pass
    else:
        positions = positions.filter(timestamp__gte=last_checkpoint.arrived)

    positions = positions.annotate(closest_fiche=closest_fiche).order_by('timestamp')

    if not positions.exists():
        return

    positions_values = list(positions.values('timestamp', 'closest_fiche'))
    current_fiche = positions_values[0]['closest_fiche']
    current_arrived = positions_values[0]['timestamp']
    current_left = positions_values[0]['timestamp']
    for position in positions_values:
        if position['closest_fiche'] != current_fiche:
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
            current_arrived = position['timestamp']
            current_left = position['timestamp']
            current_fiche = position['closest_fiche']
        else:
            current_left = position['timestamp']

    if current_fiche is not None and (
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
