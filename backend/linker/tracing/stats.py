from django.db.models import Prefetch

from linker.map.models import Fiche
from linker.people.constants import Direction
from linker.people.models import Team
from linker.tracing.models import CheckpointLog


def calculate_stats() -> dict:
    # Good luck :)

    all_fiches = list(Fiche.objects.order_by('tocht__order', 'order').all())

    next_fiche_map = {a.id: b.id for a, b in zip(all_fiches, all_fiches[1:])}
    next_fiche_map[all_fiches[-1].id] = all_fiches[0].id
    prev_fiche_map = {v: k for k, v in next_fiche_map.items()}

    fiche_per_tocht = {}
    for fiche in all_fiches:
        fiche_per_tocht.setdefault(fiche.tocht_id, []).append(fiche.id)

    next_tocht_fiche_map = {log[0]: log[-1] for log in fiche_per_tocht.values()}
    prev_tocht_fiche_map = {log[-1]: log[0] for log in fiche_per_tocht.values()}
    start_end_tocht = {}
    for tocht_id, log in fiche_per_tocht.items():
        start_end_tocht[log[0]] = tocht_id
        start_end_tocht[log[-1]] = tocht_id

    team_fiche_durations = {}
    team_tocht_durations = {}

    for team in Team.objects.prefetch_related(
        Prefetch('checkpointlogs', queryset=CheckpointLog.objects.order_by('arrived'))
    ):
        fiche_durations = {}
        tocht_durations = {}
        logs = list(team.checkpointlogs.all())
        done = set()
        for current_index, current_log in enumerate(logs):
            current_fiche = current_log.fiche_id
            if current_fiche in done:
                continue

            if team.direction == Direction.RED:
                expected_fiche = next_fiche_map[current_fiche]
            else:
                expected_fiche = prev_fiche_map[current_fiche]

            # Find the expected fiche in the next logs
            next_log = next((log for log in logs[current_index:] if log.fiche_id == expected_fiche), None)

            if next_log is not None:
                stat_fiche = current_fiche if team.direction == Direction.RED else expected_fiche
                fiche_durations[stat_fiche] = (next_log.arrived - current_log.left).total_seconds()

            # If we're at a weide
            if (team.direction == Direction.RED and current_fiche in next_tocht_fiche_map) or (
                team.direction == Direction.BLUE and current_fiche in prev_tocht_fiche_map
            ):
                if team.direction == Direction.RED:
                    expected_fiche = next_tocht_fiche_map[current_fiche]
                else:
                    expected_fiche = prev_tocht_fiche_map[current_fiche]

                # Find the expected fiche in the next logs
                next_log = next((log for log in logs[current_index:] if log.fiche_id == expected_fiche), None)

                if next_log is not None:
                    duration = (next_log.arrived - current_log.left).total_seconds()
                    tocht_durations[start_end_tocht[current_fiche]] = duration

            done.add(current_fiche)

        team_fiche_durations[team] = fiche_durations
        team_tocht_durations[team] = tocht_durations

    all_fiche_durations = {fiche.id: {Direction.RED: [], Direction.BLUE: []} for fiche in all_fiches}
    all_tocht_durations = {tocht: {Direction.RED: [], Direction.BLUE: []} for tocht in fiche_per_tocht.keys()}

    for team, fiche_durations in team_fiche_durations.items():
        for fiche, duration in fiche_durations.items():
            all_fiche_durations[fiche][team.direction].append(duration)
    for team, tocht_durations in team_tocht_durations.items():
        for tocht, duration in tocht_durations.items():
            all_tocht_durations[tocht][team.direction].append(duration)

    avg_fiche_durations = {
        fiche: {
            direction.value: {
                'average': round(sum(durations) / len(durations)) if durations else None,
                'nb_teams': len(durations),
            }
            for direction, durations in directions.items()
        }
        for fiche, directions in all_fiche_durations.items()
    }

    avg_tocht_durations = {
        tocht: {
            direction.value: {
                'average': round(sum(durations) / len(durations)) if durations else None,
                'nb_teams': len(durations),
            }
            for direction, durations in directions.items()
        }
        for tocht, directions in all_tocht_durations.items()
    }

    team_durations = {}

    for team in team_fiche_durations.keys():
        if len(team_fiche_durations[team]) > 0:
            avg_fiche_deviation = round(
                sum(
                    duration - avg_fiche_durations[fiche][team.direction.value]['average']
                    for fiche, duration in team_fiche_durations[team].items()
                )
                / len(team_fiche_durations[team])
            )
        else:
            avg_fiche_deviation = None

        if len(team_tocht_durations[team]) > 0:
            avg_tocht_deviation = round(
                sum(
                    duration - avg_tocht_durations[tocht][team.direction.value]['average']
                    for tocht, duration in team_tocht_durations[team].items()
                )
                / len(team_tocht_durations[team])
            )
        else:
            avg_tocht_deviation = None

        team_durations[team.id] = {
            'fiches': team_fiche_durations[team],
            'tochten': team_tocht_durations[team],
            'avgFicheDeviation': avg_fiche_deviation,
            'avgTochtDeviation': avg_tocht_deviation,
        }

    return {
        'fiches': avg_fiche_durations,
        'tochten': avg_tocht_durations,
        'teams': team_durations,
    }
