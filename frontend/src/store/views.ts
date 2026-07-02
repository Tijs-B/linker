// A "view" is a predefined set of filters. Instead of toggling individual
// filters, a user picks a view and its filter preset is applied at once.
//
// This file is the single place to add or change views. To add a new view,
// append an entry to `VIEWS`. Optionally give it a `permission`: only users
// whose permissions include that string can see and pick the view. Views
// without a `permission` are available to everyone.
//
// A view only describes which *teams* to show (based on their safety state).
// The organisatie (members) toggle is intentionally independent of views: it
// can be flipped in any view. A view may optionally pin `showMembers` (see the
// `showMembers` field) to force it on/off when that view is selected.

export interface ViewFilters {
  // Show "not safe" teams: teams without a safety location.
  showUnsafe: boolean;
  // Show "maybe safe" teams: teams on the bus or on a weide that is not the
  // slotweide. Also gates bus teams (a bus team needs showBus && showMaybe).
  showMaybe: boolean;
  // Show "finally safe" teams: teams on the slotweide.
  showSlotweide: boolean;
  // Show teams on the bus.
  showBus: boolean;
}

export interface View {
  id: string;
  label: string;
  description?: string;
  /** Permission required to see/use this view. Omit to make it available to everyone. */
  permission?: string;
  filters: ViewFilters;
  /** If set, applying this view forces the organisatie toggle to this value. */
  showMembers?: boolean;
}

export const DEFAULT_VIEW_ID = 'all';

export const VIEWS: View[] = [
  {
    id: DEFAULT_VIEW_ID,
    label: 'Alles',
    description: 'Toon alle teams en de organisatie',
    filters: { showUnsafe: true, showMaybe: true, showSlotweide: true, showBus: true },
    showMembers: true,
  },
  {
    // Sunday: teams on the slotweide are "finally safe" and hidden. Not-safe
    // teams and "maybe safe" teams (bus / other weides) are still shown.
    id: 'not-final-safe',
    label: 'Niet definitief safe',
    description: 'Verberg teams die op de slotweide staan',
    permission: 'view_team_details',
    filters: { showUnsafe: true, showMaybe: true, showSlotweide: false, showBus: true },
  },
  {
    // Saturday night: teams safe on any weide are hidden. Also serves Sunday's
    // "only not safe": finally-safe and maybe-safe teams are all hidden, so
    // only teams without a safety location remain.
    id: 'unsafe-only',
    label: 'Enkel onveilige teams',
    description: 'Enkel teams die nergens safe zijn',
    permission: 'view_team_details',
    filters: { showUnsafe: true, showMaybe: false, showSlotweide: false, showBus: false },
  },
  {
    id: 'organization',
    label: 'Enkel organisatie',
    description: 'Enkel de organisatie, geen teams',
    permission: 'view_team_details',
    filters: { showUnsafe: false, showMaybe: false, showSlotweide: false, showBus: false },
    showMembers: true,
  },
];

export function getViewById(id: string | null): View | undefined {
  return VIEWS.find((view) => view.id === id);
}

/** The views a user with the given permissions is allowed to see. */
export function getAvailableViews(permissions: string[]): View[] {
  return VIEWS.filter((view) => !view.permission || permissions.includes(view.permission));
}
