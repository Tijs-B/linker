import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { TrackerLog } from '../services/types.ts';

interface TrackerState {
  selectedId: number | null;
  selectedItemType: 'team' | 'member' | null;
  showHistory: boolean;
  historyLog: TrackerLog | null;
}

const initialState: TrackerState = {
  selectedId: null,
  selectedItemType: null,
  showHistory: false,
  historyLog: null,
};

const { reducer, actions } = createSlice({
  name: 'trackers',
  initialState,
  reducers: {
    selectTeam: (state, action: PayloadAction<number>) => {
      state.selectedId = action.payload;
      state.selectedItemType = 'team';
    },
    selectMember: (state, action: PayloadAction<number>) => {
      state.selectedId = action.payload;
      state.selectedItemType = 'member';
    },
    deselect: (state) => {
      state.selectedId = null;
      state.selectedItemType = null;
    },
    setShowHistory: (state, action: PayloadAction<boolean>) => {
      state.showHistory = action.payload;
      if (!action.payload) {
        state.historyLog = null;
      }
    },
    setHistoryLog: (state, action: PayloadAction<TrackerLog | null>) => {
      state.historyLog = action.payload;
    },
  },
});

export { actions as trackersActions };
export { reducer as trackersReducer };
