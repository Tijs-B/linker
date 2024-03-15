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
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/nl-be';

import Navigation from './Navigation';
import { store } from './store';
import AppThemeProvider from './theme/AppThemeProvider.tsx';

dayjs.extend(relativeTime);
dayjs.locale('nl-be');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <CssBaseline />
      <AppThemeProvider>
        <MapProvider>
          <BrowserRouter>
            <Navigation />
          </BrowserRouter>
        </MapProvider>
      </AppThemeProvider>
    </Provider>
  </React.StrictMode>,
);
