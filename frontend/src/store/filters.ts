import { createSlice } from '@reduxjs/toolkit';

interface FilterState {
  showMembers: boolean;
  showMaybe: boolean;
  showSlotweide: boolean;
  showBus: boolean;
  showRed: boolean;
  showBlue: boolean;
}

const initialState: FilterState = {
  showMembers: true,
  showMaybe: true,
  showSlotweide: true,
  showBus: true,
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
    toggleShowMaybe: (state) => {
      state.showMaybe = !state.showMaybe;
    },
    toggleShowSlotweide: (state) => {
      state.showSlotweide = !state.showSlotweide;
    },
    toggleShowBus: (state) => {
      state.showBus = !state.showBus;
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
