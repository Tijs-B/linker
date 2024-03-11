import {configureStore} from '@reduxjs/toolkit';

import {trackersReducer as trackers} from './trackers';
import {linkerApi} from "../services/linker.ts";
import {setupListeners} from "@reduxjs/toolkit/query";
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

export {trackersActions} from './trackers';

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
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

