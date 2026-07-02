import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import { DEFAULT_VIEW_ID, type ViewFilters, getViewById } from './views.ts';

interface FilterState extends ViewFilters {
  // The organisatie toggle. Independent of views: toggling it does not change
  // the active view. A view may still pin it via its `showMembers` field.
  showMembers: boolean;
  // The currently applied view, or null when the team filters were changed
  // manually (i.e. they no longer match a predefined view).
  activeViewId: string | null;
}

const defaultView = getViewById(DEFAULT_VIEW_ID)!;

const initialState: FilterState = {
  ...defaultView.filters,
  showMembers: defaultView.showMembers ?? true,
  activeViewId: DEFAULT_VIEW_ID,
};

const { reducer, actions } = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    applyView: (state, action: PayloadAction<string>) => {
      const view = getViewById(action.payload);
      if (view) {
        Object.assign(state, view.filters);
        if (view.showMembers !== undefined) {
          state.showMembers = view.showMembers;
        }
        state.activeViewId = view.id;
      }
    },
    // Independent of views: leaves activeViewId untouched.
    toggleShowMembers: (state) => {
      state.showMembers = !state.showMembers;
    },
    toggleShowUnsafe: (state) => {
      state.showUnsafe = !state.showUnsafe;
      state.activeViewId = null;
    },
    toggleShowMaybe: (state) => {
      state.showMaybe = !state.showMaybe;
      state.activeViewId = null;
    },
    toggleShowSlotweide: (state) => {
      state.showSlotweide = !state.showSlotweide;
      state.activeViewId = null;
    },
    toggleShowBus: (state) => {
      state.showBus = !state.showBus;
      state.activeViewId = null;
    },
  },
});

export { actions as filterActions };
export { reducer as filterReducer };
