import React from 'react';
import ReactDOM from 'react-dom/client';
import {MapProvider} from 'react-map-gl/maplibre';
import {Provider} from 'react-redux';

import '@fontsource/roboto/latin-300.css';
import '@fontsource/roboto/latin-400.css';
import '@fontsource/roboto/latin-500.css';
import '@fontsource/roboto/latin-700.css';

import AppThemeProvider from './theme/AppThemeProvider.jsx';
import {store} from './store';
import {CssBaseline} from '@mui/material';
import {BrowserRouter} from 'react-router-dom';
import Navigation from './Navigation.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <Provider store={store}>
            <CssBaseline/>
            <AppThemeProvider>
                <MapProvider>
                    <BrowserRouter>
                        <Navigation/>
                    </BrowserRouter>
                </MapProvider>
            </AppThemeProvider>
        </Provider>
    </React.StrictMode>,
);
