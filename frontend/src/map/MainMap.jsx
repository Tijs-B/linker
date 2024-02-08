import {memo, useEffect, useRef, useState} from 'react';
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
import {useGetTochtenQuery} from "../services/linker.js";
import bbox from "@turf/bbox";
import {feature, featureCollection} from "@turf/helpers";

const BOUNDS_OPTIONS = {padding: {top: 30, left: 30, right: 30, bottom: 30}};
const DEFAULT_INITIAL_BOUNDS = {
    bounds: [5.9011, 50.3130, 6.0151, 50.3805],
    fitBoundsOptions: BOUNDS_OPTIONS,
};

export default memo(function MainMap({trackers}) {
    const theme = useTheme();
    const desktop = useMediaQuery(theme.breakpoints.up('md'));
    const dispatch = useDispatch();
    const [showHeatmap, setShowHeatmap] = useState(false);
    const [showSatellite, setShowSatellite] = useState(false);
    const [hasRecentered, setRecentered] = useState(false);
    const [initialBounds, setInitialBounds] = useState(DEFAULT_INITIAL_BOUNDS);
    const mapRef = useRef();
    const {data: tochten} = useGetTochtenQuery();

    const mapStyle = showHeatmap
        ? 'https://tiles.tijsb.be/styles/dark-matter/style.json'
        : showSatellite ? 'https://tiles.tijsb.be/styles/satellite/style.json' :
            'https://tiles.tijsb.be/styles/outdoor/style.json';

    useEffect(() => {
        if (tochten && mapRef && mapRef.current && !hasRecentered) {
            let features = Object.values(tochten.entities).map((tocht) => feature(tocht.route));
            let bounds = bbox(featureCollection(features));
            mapRef.current.fitBounds(bounds, BOUNDS_OPTIONS);
            setRecentered(true);
            setInitialBounds({bounds, fitBoundsOptions: BOUNDS_OPTIONS});
        }
    }, [tochten, mapRef, hasRecentered, setRecentered])

    return (
        <Map
            id="mainMap"
            initialViewState={DEFAULT_INITIAL_BOUNDS}
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
            <TrackerLayer visible={!showHeatmap} trackers={trackers}/>
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
})
