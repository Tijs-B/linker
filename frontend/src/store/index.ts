import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

import { configureStore, createSelector } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

import { linkerApi } from '../services/linker.ts';
import { trackersReducer as trackers } from './trackers';

export { trackersActions } from './trackers';

export const store = configureStore({
  reducer: {
    [linkerApi.reducerPath]: linkerApi.reducer,
    trackers: trackers,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(linkerApi.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

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
