from django.db.models import Prefetch

from linker.map.models import Fiche, Tocht
from linker.people.constants import Direction
from linker.people.models import Team
from linker.tracing.models import CheckpointLog


def get_next_fiche_map(all_fiches: list[Fiche]) -> dict[Direction, dict[int, int]]:
    next_fiche_map: dict[int, int] = {a.id: b.id for a, b in zip(all_fiches, all_fiches[1:])}
    next_fiche_map[all_fiches[-1].id] = all_fiches[0].id
    prev_fiche_map: dict[int, int] = {v: k for k, v in next_fiche_map.items()}
    return {Direction.RED: next_fiche_map, Direction.BLUE: prev_fiche_map}


def get_next_tocht_fiche_partial_map(all_fiches: list[Fiche]) -> dict[Direction, dict[int, tuple[int, int]]]:
    # Voor rood: C2-C9
    # Voor blauw: C9-C2
    fiche_per_tocht: dict[int, list[int]] = {}
    for fiche in all_fiches:
        fiche_per_tocht.setdefault(fiche.tocht_id, []).append(fiche.id)

    rood_map = {fiches[1]: (fiches[-1], tocht) for tocht, fiches in fiche_per_tocht.items()}
    blauw_map = {fiches[-1]: (fiches[1], tocht) for tocht, fiches in fiche_per_tocht.items()}

    return {Direction.RED: rood_map, Direction.BLUE: blauw_map}


def get_next_tocht_fiche_full_map(all_fiches: list[Fiche]) -> dict[Direction, dict[int, tuple[int, int]]]:
    # Voor rood: C1-D1
    # Voor blauw: D1-C1
    first_fiches = list(f for f in all_fiches if f.order == 1)
    next_map = {a.id: (b.id, a.tocht_id) for a, b in zip(first_fiches, first_fiches[1:])}
    next_map[first_fiches[-1].id] = (first_fiches[0].id, first_fiches[-1].tocht_id)
    prev_map = {end: (start, tocht) for start, (end, tocht) in next_map.items()}

    return {Direction.RED: next_map, Direction.BLUE: prev_map}


def calculate_stats() -> dict:
    # Good luck :)
    all_fiches: list[Fiche] = list(Fiche.objects.order_by('tocht__order', 'order').all())
    all_tochten: list[Tocht] = list(Tocht.objects.filter(is_alternative=False).order_by('order').all())

    next_fiche_map = get_next_fiche_map(all_fiches)
    next_tocht_fiche_partial_map = get_next_tocht_fiche_partial_map(all_fiches)
    next_tocht_fiche_full_map = get_next_tocht_fiche_full_map(all_fiches)

    team_fiche_durations = {}
    team_full_tocht_durations = {}
    team_partial_tocht_durations = {}

    for team in Team.objects.prefetch_related(
        Prefetch('checkpointlogs', queryset=CheckpointLog.objects.order_by('arrived'))
    ):
        fiche_durations = {}
        full_tocht_durations = {}
        partial_tocht_durations = {}

        logs = list(team.checkpointlogs.all())
        done = set()

        for current_index, current_log in enumerate(logs):
            current_fiche = current_log.fiche_id
            if current_fiche in done:
                continue

            expected_fiche = next_fiche_map[team.direction][current_fiche]

            # Find the expected fiche in the next logs
            next_log = next((log for log in logs[current_index:] if log.fiche_id == expected_fiche), None)

            if next_log is not None:
                stat_fiche = current_fiche if team.direction == Direction.RED else expected_fiche
                fiche_durations[stat_fiche] = (next_log.arrived - current_log.left).total_seconds()

            if current_fiche in next_tocht_fiche_partial_map[team.direction]:
                expected_fiche, tocht = next_tocht_fiche_partial_map[team.direction][current_fiche]

                # Find the expected fiche in the next logs
                next_log = next((log for log in logs[current_index:] if log.fiche_id == expected_fiche), None)

                if next_log is not None:
                    duration = (next_log.arrived - current_log.left).total_seconds()
                    partial_tocht_durations[tocht] = duration

            if current_fiche in next_tocht_fiche_full_map[team.direction]:
                expected_fiche, tocht = next_tocht_fiche_full_map[team.direction][current_fiche]

                next_log = next((log for log in logs[current_index:] if log.fiche_id == expected_fiche), None)

                if next_log is not None:
                    duration = (next_log.arrived - current_log.left).total_seconds()
                    full_tocht_durations[tocht] = duration

            done.add(current_fiche)

        team_fiche_durations[team] = fiche_durations
        team_full_tocht_durations[team] = full_tocht_durations
        team_partial_tocht_durations[team] = partial_tocht_durations

    all_fiche_durations = {fiche.id: {Direction.RED: [], Direction.BLUE: []} for fiche in all_fiches}
    all_partial_tocht_durations = {tocht.id: {Direction.RED: [], Direction.BLUE: []} for tocht in all_tochten}
    all_full_tocht_durations = {tocht.id: {Direction.RED: [], Direction.BLUE: []} for tocht in all_tochten}

    for team, fiche_durations in team_fiche_durations.items():
        for fiche, duration in fiche_durations.items():
            all_fiche_durations[fiche][team.direction].append(duration)
    for team, tocht_durations in team_partial_tocht_durations.items():
        for tocht, duration in tocht_durations.items():
            all_partial_tocht_durations[tocht][team.direction].append(duration)
    for team, tocht_durations in team_full_tocht_durations.items():
        for tocht, duration in tocht_durations.items():
            all_full_tocht_durations[tocht][team.direction].append(duration)

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

    avg_partial_tocht_durations = {
        tocht: {
            direction.value: {
                'average': round(sum(durations) / len(durations)) if durations else None,
                'nb_teams': len(durations),
            }
            for direction, durations in directions.items()
        }
        for tocht, directions in all_partial_tocht_durations.items()
    }

    avg_full_tocht_durations = {
        tocht: {
            direction.value: {
                'average': round(sum(durations) / len(durations)) if durations else None,
                'nb_teams': len(durations),
            }
            for direction, durations in directions.items()
        }
        for tocht, directions in all_full_tocht_durations.items()
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

        if len(team_full_tocht_durations[team]) > 0:
            avg_full_tocht_deviation = round(
                sum(
                    duration - avg_full_tocht_durations[tocht][team.direction.value]['average']
                    for tocht, duration in team_full_tocht_durations[team].items()
                )
                / len(team_full_tocht_durations[team])
            )
        else:
            avg_full_tocht_deviation = None

        if len(team_partial_tocht_durations[team]) > 0:
            avg_partial_tocht_deviation = round(
                sum(
                    duration - avg_partial_tocht_durations[tocht][team.direction.value]['average']
                    for tocht, duration in team_partial_tocht_durations[team].items()
                )
                / len(team_partial_tocht_durations[team])
            )
        else:
            avg_partial_tocht_deviation = None

        team_durations[team.id] = {
            'fiches': team_fiche_durations[team],
            'fullTochten': team_full_tocht_durations[team],
            'partialTochten': team_partial_tocht_durations[team],
            'avgFicheDeviation': avg_fiche_deviation,
            'avgFullTochtDeviation': avg_full_tocht_deviation,
            'avgPartialTochtDeviation': avg_partial_tocht_deviation,
        }

    return {
        'fiches': avg_fiche_durations,
        'fullTochten': avg_full_tocht_durations,
        'partialTochten': avg_partial_tocht_durations,
        'teams': team_durations,
    }
