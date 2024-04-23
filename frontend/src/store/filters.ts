import { createSlice } from '@reduxjs/toolkit';

interface FilterState {
  showMembers: boolean;
  showSafe: boolean;
  showRed: boolean;
  showBlue: boolean;
}

const initialState: FilterState = {
  showMembers: true,
  showSafe: true,
  showRed: true,
  showBlue: true,
};

const { reducer, actions } = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    toggleShowMembers: (state) => {
      state.showMembers = !state.showMembers;
    },
    toggleShowSafe: (state) => {
      state.showSafe = !state.showSafe;
    },
    toggleShowRed: (state) => {
      state.showRed = !state.showRed;
    },
    toggleShowBlue: (state) => {
      state.showBlue = !state.showBlue;
    },
  },
});

export { actions as filterActions };
export { reducer as filterReducer };
