import {createSlice} from '@reduxjs/toolkit';

const {reducer, actions} = createSlice({
    name: 'trackers',
    initialState: {
        selectedId: null,
        showHistory: false,
        historyLog: null,
    },
    reducers: {
        setSelectedId: (state, action) => {
            state.selectedId = action.payload;
        },
        setShowHistory: (state, action) => {
            state.showHistory = action.payload;
            if (action.payload === false) {
                state.historyLog = null;
            }
        },
        setHistoryLog: (state, action) => {
            state.historyLog = action.payload;
        },
    },
});

export {actions as trackersActions};
export {reducer as trackersReducer};
