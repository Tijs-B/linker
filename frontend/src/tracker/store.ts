import type { TypedUseSelectorHook } from 'react-redux';
import { useDispatch, useSelector } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

import { linkerApi } from '../services/linker';

export const store = configureStore({
  reducer: {
    [linkerApi.reducerPath]: linkerApi.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(linkerApi.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
