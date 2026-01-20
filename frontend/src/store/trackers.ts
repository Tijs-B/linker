import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { Point } from 'geojson';

interface HistoryItem {
  point: Point;
  timestamp: string;
}

interface TrackerState {
  selectedId: number | null;
  selectedItemType: 'team' | 'member' | null;
  showHistory: boolean;
  historyItem: HistoryItem | null;
}

const initialState: TrackerState = {
  selectedId: null,
  selectedItemType: null,
  showHistory: false,
  historyItem: null,
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
        state.historyItem = null;
      }
    },
    setHistoryItem: (state, action: PayloadAction<HistoryItem | null>) => {
      state.historyItem = action.payload;
    },
  },
});

export { actions as trackersActions };
export { reducer as trackersReducer };
