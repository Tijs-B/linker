import type { Team } from '../services/types.ts';
import type { ViewFilters } from '../store/views.ts';

// The safety state of a team, derived from its last safety location. This is
// the single source of truth for that domain concept - both the team filtering
// (see isTeamVisible) and the list chip (see TrackerList) derive from it.
export type TeamSafetyState =
  | 'unsafe' // no safety location
  | 'bus' // on the bus
  | 'maybe' // on a weide that is not the slotweide ("maybe safe")
  | 'slotweide'; // on the slotweide ("finally safe")

export function getTeamSafetyState(
  team: Team,
  weideSlotweide: Map<string, boolean>,
): TeamSafetyState {
  const loc = team.last_safety_location?.trim();
  if (!loc) {
    return 'unsafe';
  }
  if (loc.toLowerCase() === 'bus') {
    return 'bus';
  }
  return weideSlotweide.get(loc) === true ? 'slotweide' : 'maybe';
}

/** Whether a team in the given safety state is shown under the given filters. */
export function isTeamVisible(state: TeamSafetyState, filters: ViewFilters): boolean {
  switch (state) {
    case 'unsafe':
      return filters.showUnsafe;
    case 'bus':
      return filters.showBus && filters.showMaybe;
    case 'maybe':
      return filters.showMaybe;
    case 'slotweide':
      return filters.showSlotweide;
  }
}
