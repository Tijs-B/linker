import {configureStore} from '@reduxjs/toolkit';

import {trackersReducer as trackers} from './trackers';
import {linkerApi} from "../services/linker.js";
import {setupListeners} from "@reduxjs/toolkit/query";

export {trackersActions} from './trackers';

export const store = configureStore({
    reducer: {
        [linkerApi.reducerPath]: linkerApi.reducer,
        trackers: trackers,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(linkerApi.middleware),
});

setupListeners(store.dispatch)
