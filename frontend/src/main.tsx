import React from 'react';
import ReactDOM from 'react-dom/client';
import { MapProvider } from 'react-map-gl/maplibre';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';

import { CssBaseline } from '@mui/material';

import '@fontsource/roboto/latin-300.css';
import '@fontsource/roboto/latin-400.css';
import '@fontsource/roboto/latin-500.css';
import '@fontsource/roboto/latin-700.css';
import dayjs from 'dayjs';
import 'dayjs/locale/nl-be';
import relativeTime from 'dayjs/plugin/relativeTime';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { SnackbarProvider } from 'notistack';

import Navigation from './Navigation';
import ReloadPrompt from './components/ReloadPrompt.tsx';
import { notifications } from './config';
import { store } from './store';
import AppThemeProvider from './theme/AppThemeProvider.tsx';

dayjs.extend(utc);
dayjs.extend(relativeTime);
dayjs.extend(timezone);
dayjs.locale('nl-be');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <AppThemeProvider>
        <CssBaseline enableColorScheme />
        <SnackbarProvider {...notifications}>
          <MapProvider>
            <BrowserRouter>
              <Navigation />
            </BrowserRouter>
          </MapProvider>
          <ReloadPrompt />
        </SnackbarProvider>
      </AppThemeProvider>
    </Provider>
  </React.StrictMode>,
);
