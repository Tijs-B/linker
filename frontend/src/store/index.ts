import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

import { configureStore, createSelector } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

import { linkerApi } from '../services/linker.ts';
import { filterReducer as filter } from './filters.ts';
import { trackersReducer as trackers } from './trackers';

export { trackersActions } from './trackers';
export { filterActions } from './filters.ts';

export const store = configureStore({
  reducer: {
    [linkerApi.reducerPath]: linkerApi.reducer,
    trackers: trackers,
    filter: filter,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(linkerApi.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const selectSelectedTeam = createSelector(
  [
    (state: RootState) => state.trackers.selectedId,
    (state: RootState) => state.trackers.selectedItemType,
    linkerApi.endpoints.getTeams.select(undefined),
  ],
  (selectedId, selectedItemType, teams) => {
    if (selectedId === null || selectedItemType !== 'team' || !teams.data) {
      return null;
    }
    return teams.data.entities[selectedId];
  },
);

export const selectSelectedMember = createSelector(
  [
    (state: RootState) => state.trackers.selectedId,
    (state: RootState) => state.trackers.selectedItemType,
    linkerApi.endpoints.getOrganizationMembers.select(undefined),
  ],
  (selectedId, selectedItemType, members) => {
    if (selectedId === null || selectedItemType !== 'member' || !members.data) {
      return null;
    }
    return members.data.entities[selectedId];
  },
);

export const selectSelectedItem = createSelector(
  [
    (state: RootState) => state.trackers.selectedId,
    (state: RootState) => state.trackers.selectedItemType,
    linkerApi.endpoints.getTeams.select(undefined),
    linkerApi.endpoints.getOrganizationMembers.select(undefined),
  ],
  (selectedId, selectedItemType, teams, members) => {
    if (selectedId === null || selectedItemType === null) {
      return null;
    }
    if (selectedItemType === 'team') {
      if (!teams.data) {
        return null;
      }
      return teams.data.entities[selectedId];
    }
    if (selectedItemType === 'member') {
      if (!members.data) {
        return null;
      }
      return members.data.entities[selectedId];
    }
    return null;
  },
);

export const selectSelectedTracker = createSelector(
  [selectSelectedItem, linkerApi.endpoints.getTrackers.select(undefined)],
  (selectedItem, trackers) => {
    if (selectedItem === null || !trackers.data || selectedItem.tracker === null) {
      return null;
    }
    return trackers.data.entities[selectedItem.tracker];
  },
);

export const selectFilterActive = createSelector([(state: RootState) => state.filter], (filter) => {
  return (
    !filter.showMembers ||
    !filter.showSafe ||
    !filter.showBus ||
    !filter.showRed ||
    !filter.showBlue
  );
});
