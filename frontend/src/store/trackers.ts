import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TrackerLog } from '../services/types.ts';

interface TrackerState {
    selectedId: number | null;
    showHistory: boolean;
    historyLog: TrackerLog | null;
}

const initialState: TrackerState = {
    selectedId: null,
    showHistory: false,
    historyLog: null,
}

const {reducer, actions} = createSlice({
    name: 'trackers',
    initialState,
    reducers: {
        setSelectedId: (state, action: PayloadAction<number | null>) => {
            state.selectedId = action.payload;
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

export {actions as trackersActions};
export {reducer as trackersReducer};
