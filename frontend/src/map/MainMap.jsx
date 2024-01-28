import {useRef, useState} from 'react';
import Map, {GeolocateControl, NavigationControl, ScaleControl} from 'react-map-gl/maplibre';
import {useDispatch} from 'react-redux';

import SatelliteIcon from '@mui/icons-material/Satellite';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap';
import {IconButton, useMediaQuery, useTheme} from '@mui/material';

import {css} from '@emotion/react';
import 'maplibre-gl/dist/maplibre-gl.css';

import {trackersActions} from '../store';
import BackgroundLayers from './BackgroundLayers';
import CustomOverlay from './CustomOverlay.jsx';
import MapNoteLayer from './MapNoteLayer';
import MapPadding from './MapPadding.jsx';
import TrackerHistoryLayer from './TrackerHistoryLayer.jsx';
import TrackerLayer from './TrackerLayer.jsx';

const initialBounds = {
    bounds: [5.901138, 50.313015, 6.01506, 50.380425],
    fitBoundsOptions: {padding: {top: 30, left: 30, right: 30, bottom: 30}},
};

export default function MainMap() {
    const theme = useTheme();
    const desktop = useMediaQuery(theme.breakpoints.up('md'));
    const dispatch = useDispatch();
    const [showHeatmap, setShowHeatmap] = useState(false);
    const [showSatellite, setShowSatellite] = useState(false);
    const mapRef = useRef();

    const mapStyle = showHeatmap
        ? 'https://tiles.tijsb.be/styles/dark-matter/style.json'
        : showSatellite ? 'https://tiles.tijsb.be/styles/satellite/style.json' :
            'https://tiles.tijsb.be/styles/outdoor/style.json';

    return (
        <Map
            id="mainMap"
            initialViewState={initialBounds}
            style={{width: '100%', height: '100%'}}
            css={css`
                width: 100%;
                height: 100%;
            `}
            mapStyle={mapStyle}
            onClick={() => {
                dispatch(trackersActions.setShowHistory(false));
                dispatch(trackersActions.setSelectedId(null));
            }}
            ref={mapRef}
            interactiveLayerIds={['trackers']}
        >
            <BackgroundLayers showHeatmap={showHeatmap}/>

            <MapNoteLayer visible={!showHeatmap}/>
            <TrackerLayer visible={!showHeatmap}/>
            <TrackerHistoryLayer visible={!showHeatmap}/>

            <NavigationControl/>
            <GeolocateControl/>
            <ScaleControl position="bottom-right"/>

            <CustomOverlay>
                <div className="maplibregl-ctrl maplibregl-ctrl-group">
                    <IconButton
                        onClick={() => {
                            if (showHeatmap) {
                                setShowHeatmap(false);
                            } else {
                                setShowHeatmap(true);
                                setShowSatellite(false);
                            }
                        }}
                    >
                        <WhatshotIcon
                            color="primary"
                            sx={{color: showHeatmap ? '' : '#000', marginTop: '2px'}}
                        />
                    </IconButton>
                </div>
            </CustomOverlay>

            <CustomOverlay>
                <div className="maplibregl-ctrl maplibregl-ctrl-group">
                    <IconButton
                        onClick={() => {
                            if (showSatellite) {
                                setShowSatellite(false);
                            } else {
                                setShowSatellite(true);
                                setShowHeatmap(false);
                            }
                        }}
                    >
                        <SatelliteIcon
                            color="primary"
                            sx={{color: showSatellite ? '' : '#000', marginTop: '2px'}}
                        />
                    </IconButton>
                </div>
            </CustomOverlay>

            <CustomOverlay>
                <div className="maplibregl-ctrl maplibregl-ctrl-group">
                    <IconButton
                        onClick={() =>
                            mapRef.current.fitBounds(initialBounds.bounds, initialBounds.fitBoundsOptions)
                        }
                    >
                        <ZoomOutMapIcon sx={{color: '#000', marginTop: '2px'}}/>
                    </IconButton>
                </div>
            </CustomOverlay>

            {desktop && <MapPadding left={parseInt(theme.dimensions.drawerWidthDesktop, 10)}/>}
        </Map>
    );
}
