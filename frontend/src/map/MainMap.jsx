import {memo, useCallback, useEffect, useRef, useState} from 'react';
import Map, {GeolocateControl, NavigationControl, ScaleControl} from 'react-map-gl/maplibre';
import {useDispatch} from 'react-redux';

import FlagIcon from '@mui/icons-material/Flag';
import SatelliteIcon from '@mui/icons-material/Satellite';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap';
import {
    Button,
    Dialog, DialogActions, DialogContent, DialogContentText,
    DialogTitle,
    IconButton,
    TextField,
    useMediaQuery,
    useTheme
} from '@mui/material';

import {css} from '@emotion/react';
import 'maplibre-gl/dist/maplibre-gl.css';

import {trackersActions} from '../store';
import BackgroundLayers from './BackgroundLayers';
import CustomOverlay from './CustomOverlay.jsx';
import MapNoteLayer from './MapNoteLayer';
import MapPadding from './MapPadding.jsx';
import TrackerHistoryLayer from './TrackerHistoryLayer.jsx';
import TrackerLayer from './TrackerLayer.jsx';
import {useCreateMapNoteMutation, useGetTochtenQuery} from "../services/linker.js";
import bbox from "@turf/bbox";
import {feature, featureCollection} from "@turf/helpers";

const BOUNDS_OPTIONS = {padding: {top: 30, left: 30, right: 30, bottom: 30}};
const DEFAULT_INITIAL_BOUNDS = {
    bounds: [5.9011, 50.3130, 6.0151, 50.3805],
    fitBoundsOptions: BOUNDS_OPTIONS,
};

const MainMap = memo(function MainMap({trackers}) {
    const theme = useTheme();
    const desktop = useMediaQuery(theme.breakpoints.up('md'));
    const dispatch = useDispatch();
    const [cursor, setCursor] = useState('inherit');
    const [showHeatmap, setShowHeatmap] = useState(false);
    const [showSatellite, setShowSatellite] = useState(false);
    const [hasRecentered, setRecentered] = useState(false);
    const [creatingMarker, setCreatingMarker] = useState(false);
    const [mapNoteLngLat, setMapNoteLngLat] = useState(null);
    const [mapNoteDescription, setMapNoteDescription] = useState('');
    const [createMapNoteDialogOpen, setCreateMapNoteDialogOpen] = useState(false);
    const [initialBounds, setInitialBounds] = useState(DEFAULT_INITIAL_BOUNDS);
    const mapRef = useRef();
    const {data: tochten} = useGetTochtenQuery();
    const createMapNote = useCreateMapNoteMutation()[0];

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
    }, [tochten, mapRef, hasRecentered, setRecentered]);

    const onMouseEnter = useCallback(() => {
        if (!creatingMarker) {
            setCursor('pointer');
        }
    }, [creatingMarker]);
    const onMouseLeave = useCallback(() => {
        if (!creatingMarker) {
            setCursor('inherit');
        }
    }, [creatingMarker]);

    const onToggleHeatmap = useCallback(() => {
        if (showHeatmap) {
            setShowHeatmap(false);
        } else {
            setShowHeatmap(true);
            setShowSatellite(false);
        }
    }, [showHeatmap]);

    const onToggleSatellite = useCallback(() => {
        if (showSatellite) {
            setShowSatellite(false);
        } else {
            setShowSatellite(true);
            setShowHeatmap(false);
        }
    }, [showSatellite]);

    const onResetBounds = useCallback(() => {
        mapRef.current.fitBounds(initialBounds.bounds, initialBounds.fitBoundsOptions);
    }, [mapRef, initialBounds])

    const onStartMapNoteCreation = useCallback(() => {
        if (creatingMarker) {
            setCreatingMarker(false);
            setCursor('inherit');
        } else {
            setCreatingMarker(true);
            setCursor('crosshair');
        }
    }, [creatingMarker]);

    const onMapClick = useCallback((e) => {
        if (creatingMarker) {
            setCreatingMarker(false);
            setCursor('inherit');
            setMapNoteLngLat(e.lngLat);
            setCreateMapNoteDialogOpen(true);
        } else {
            dispatch(trackersActions.setShowHistory(false));
            dispatch(trackersActions.setSelectedId(null));
        }
    }, [creatingMarker, dispatch]);

    const onCreateMapNoteDialogClose = useCallback(() => {
        setCreatingMarker(false);
        setCreateMapNoteDialogOpen(false);
        setMapNoteLngLat(null);
        setMapNoteDescription('');
        setCursor('inherit');
    }, []);

    const onCreateMapNote = useCallback(() => {
        let {lng, lat} = mapNoteLngLat;
        let data = {
            content: mapNoteDescription,
            point: {
                type: 'Point',
                coordinates: [lng, lat]
            },
        }
        createMapNote(data);
        setCreateMapNoteDialogOpen(false);
        setMapNoteLngLat(null);
        setMapNoteDescription('');
        setCreatingMarker(false);
        setCursor('inherit');
    }, [createMapNote, mapNoteDescription, mapNoteLngLat])

    return (
        <>
            <Map
                id="mainMap"
                initialViewState={DEFAULT_INITIAL_BOUNDS}
                style={{width: '100%', height: '100%'}}
                css={css`
                    width: 100%;
                    height: 100%;
                `}
                mapStyle={mapStyle}
                onClick={onMapClick}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                cursor={cursor}
                ref={mapRef}
                interactiveLayerIds={['trackers', 'map-notes']}
                styleDiffing={false}
                // maxPitch={85}
                // terrain={{source: 'relief', exaggeration: 2}}
                // fog={{range: [2,12], color: 'white', 'horizon-blend': 0.1}}
            >
                <BackgroundLayers showHeatmap={showHeatmap}/>

                <MapNoteLayer visible={!showHeatmap}/>
                <TrackerLayer visible={!showHeatmap} trackers={trackers}/>
                <TrackerHistoryLayer visible={!showHeatmap}/>

                <NavigationControl/>
                <GeolocateControl/>
                <ScaleControl position="bottom-right"/>

                <CustomOverlay>
                    <IconButton onClick={onToggleHeatmap}>
                        <WhatshotIcon
                            color="primary"
                            sx={{color: showHeatmap ? '' : '#000', marginTop: '2px'}}
                        />
                    </IconButton>
                </CustomOverlay>

                <CustomOverlay>
                    <IconButton onClick={onToggleSatellite}>
                        <SatelliteIcon
                            color="primary"
                            sx={{color: showSatellite ? '' : '#000', marginTop: '2px'}}
                        />
                    </IconButton>
                </CustomOverlay>

                <CustomOverlay>
                    <IconButton onClick={onResetBounds}>
                        <ZoomOutMapIcon sx={{color: '#000', marginTop: '2px'}}/>
                    </IconButton>
                </CustomOverlay>

                <CustomOverlay>
                    <IconButton onClick={onStartMapNoteCreation}>
                        <FlagIcon
                            color={"primary"}
                            sx={{color: creatingMarker ? '' : '#000', marginTop: '2px'}}
                        />
                    </IconButton>
                </CustomOverlay>

                {desktop && <MapPadding left={parseInt(theme.dimensions.drawerWidthDesktop, 10)}/>}
            </Map>
            <Dialog open={createMapNoteDialogOpen} onClose={onCreateMapNoteDialogClose}>
                <DialogTitle>Nieuwe kaartnotitie</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Je staat op het punt een nieuwe kaartnotitie te maken. Geef een korte beschrijving.
                    </DialogContentText>
                    <TextField
                        value={mapNoteDescription}
                        onChange={(e) => setMapNoteDescription(e.target.value)}
                        label="Beschrijving"
                        variant="standard"
                        fullWidth
                        margin="dense"
                        autoFocus
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={onCreateMapNote} variant="contained">Toevoegen</Button>
                </DialogActions>
            </Dialog>
        </>
    );
});

export default MainMap;
