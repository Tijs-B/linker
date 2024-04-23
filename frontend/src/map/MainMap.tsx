import { ChangeEvent, memo, useCallback, useEffect, useRef, useState } from 'react';
import Map, {
  GeolocateControl,
  LngLat,
  MapLayerMouseEvent,
  MapRef,
  NavigationControl,
  ScaleControl,
} from 'react-map-gl/maplibre';

import FlagIcon from '@mui/icons-material/Flag';
import SatelliteIcon from '@mui/icons-material/Satellite';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  TextField,
  useMediaQuery,
  useTheme,
} from '@mui/material';

import bbox from '@turf/bbox';
import { feature, featureCollection } from '@turf/helpers';
import 'maplibre-gl/dist/maplibre-gl.css';

import {
  useCreateMapNoteMutation,
  useGetOrganizationMembersQuery,
  useGetTeamsQuery,
  useGetTochtenQuery,
} from '../services/linker.ts';
import { OrganizationMember, Team } from '../services/types.ts';
import { trackersActions, useAppDispatch } from '../store/index.js';
import { generateAllIcons } from '../utils/icons.ts';
import BackgroundLayers from './BackgroundLayers';
import CustomOverlay from './CustomOverlay.jsx';
import MapNoteLayer from './MapNoteLayer';
import MapPadding from './MapPadding.jsx';
import TrackerHistoryLayer from './TrackerHistoryLayer.jsx';
import TrackerLayer from './TrackerLayer.jsx';

const BOUNDS_OPTIONS = { padding: { top: 30, left: 30, right: 30, bottom: 30 } };
const DEFAULT_INITIAL_BOUNDS = {
  bounds: [5.552625, 50.217043, 5.68067, 50.295693] as [number, number, number, number],
  fitBoundsOptions: BOUNDS_OPTIONS,
};

interface MainMapProps {
  filteredTeams: Team[];
  filteredMembers: OrganizationMember[];
}

const MainMap = memo(function MainMap({ filteredTeams, filteredMembers }: MainMapProps) {
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const dispatch = useAppDispatch();

  const [cursor, setCursor] = useState('inherit');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showSatellite, setShowSatellite] = useState(false);
  const [hasRecentered, setRecentered] = useState(false);
  const [creatingMarker, setCreatingMarker] = useState(false);
  const [mapNoteLngLat, setMapNoteLngLat] = useState<LngLat | null>(null);
  const [mapNoteDescription, setMapNoteDescription] = useState('');
  const [createMapNoteDialogOpen, setCreateMapNoteDialogOpen] = useState(false);
  const [initialBounds, setInitialBounds] = useState(DEFAULT_INITIAL_BOUNDS);
  const [iconsAdded, setIconsAdded] = useState(true);

  const mapRef = useRef<MapRef>(null);
  const { data: tochten } = useGetTochtenQuery();
  const { data: teams } = useGetTeamsQuery();
  const { data: members } = useGetOrganizationMembersQuery();
  const createMapNote = useCreateMapNoteMutation()[0];

  const mapStyle = showHeatmap
    ? 'https://tiles.tijsb.be/styles/dark-matter/style.json'
    : showSatellite
    ? 'https://tiles.tijsb.be/styles/satellite/style.json'
    : 'https://tiles.tijsb.be/styles/outdoor/style.json';

  useEffect(() => {
    if (tochten && mapRef && mapRef.current && !hasRecentered) {
      const features = Object.values(tochten.entities).map((tocht) => feature(tocht.route));
      const bounds = bbox(featureCollection(features)) as [number, number, number, number];

      mapRef.current.fitBounds(bounds, BOUNDS_OPTIONS);
      setRecentered(true);
      setInitialBounds({ bounds, fitBoundsOptions: BOUNDS_OPTIONS });
    }
  }, [tochten, mapRef, hasRecentered, setRecentered]);

  useEffect(() => {
    if (teams && members && mapRef && mapRef.current && !iconsAdded) {
      const allItems = [...Object.values(teams.entities), ...Object.values(members.entities)];
      setIconsAdded(true);
      generateAllIcons(allItems, (name, image) => {
        mapRef.current!.addImage(name, image);
      });
    }
  }, [iconsAdded, members, teams, mapRef]);

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
      setIconsAdded(false);
    } else {
      setShowHeatmap(true);
      setShowSatellite(false);
    }
  }, [showHeatmap]);

  const onToggleSatellite = useCallback(() => {
    if (showSatellite) {
      setShowSatellite(false);
      setIconsAdded(false);
    } else {
      setShowSatellite(true);
      setShowHeatmap(false);
      setIconsAdded(false);
    }
  }, [showSatellite]);

  const onResetBounds = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.fitBounds(initialBounds.bounds, initialBounds.fitBoundsOptions);
    }
  }, [mapRef, initialBounds]);

  const onStartMapNoteCreation = useCallback(() => {
    if (creatingMarker) {
      setCreatingMarker(false);
      setCursor('inherit');
    } else {
      setCreatingMarker(true);
      setCursor('crosshair');
    }
  }, [creatingMarker]);

  const onMapClick = useCallback(
    (event: MapLayerMouseEvent) => {
      if (creatingMarker) {
        setCreatingMarker(false);
        setCursor('inherit');
        setMapNoteLngLat(event.lngLat);
        setCreateMapNoteDialogOpen(true);
      } else {
        dispatch(trackersActions.setShowHistory(false));
        dispatch(trackersActions.deselect());
      }
    },
    [creatingMarker, dispatch],
  );

  const onCreateMapNoteDialogClose = useCallback(() => {
    setCreatingMarker(false);
    setCreateMapNoteDialogOpen(false);
    setMapNoteLngLat(null);
    setMapNoteDescription('');
    setCursor('inherit');
  }, []);

  const onCreateMapNote = useCallback(() => {
    if (!mapNoteLngLat) {
      return;
    }
    const { lng, lat } = mapNoteLngLat;
    const data = {
      content: mapNoteDescription,
      point: {
        type: 'Point' as const,
        coordinates: [lng, lat],
      },
    };
    createMapNote(data);
    setCreateMapNoteDialogOpen(false);
    setMapNoteLngLat(null);
    setMapNoteDescription('');
    setCreatingMarker(false);
    setCursor('inherit');
  }, [createMapNote, mapNoteDescription, mapNoteLngLat]);

  const onMapNoteDescriptionChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setMapNoteDescription(event.target.value),
    [],
  );

  const onMapLoad = useCallback(() => setIconsAdded(false), []);

  return (
    <>
      <Map
        id="mainMap"
        initialViewState={DEFAULT_INITIAL_BOUNDS}
        style={{ width: '100%', height: '100%' }}
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
        onLoad={onMapLoad}
        attributionControl={false}
      >
        <BackgroundLayers showHeatmap={showHeatmap} />

        <MapNoteLayer visible={!showHeatmap} />
        <TrackerLayer
          visible={!showHeatmap}
          filteredTeams={filteredTeams}
          filteredMembers={filteredMembers}
        />
        <TrackerHistoryLayer visible={!showHeatmap} />

        <NavigationControl />
        <GeolocateControl trackUserLocation positionOptions={{ enableHighAccuracy: true }} />
        <ScaleControl position="bottom-right" />

        <CustomOverlay>
          <IconButton onClick={onToggleHeatmap}>
            <WhatshotIcon
              color="primary"
              sx={{ color: showHeatmap ? '' : '#000', marginTop: '2px' }}
            />
          </IconButton>
        </CustomOverlay>

        <CustomOverlay>
          <IconButton onClick={onToggleSatellite}>
            <SatelliteIcon
              color="primary"
              sx={{ color: showSatellite ? '' : '#000', marginTop: '2px' }}
            />
          </IconButton>
        </CustomOverlay>

        <CustomOverlay>
          <IconButton onClick={onResetBounds}>
            <ZoomOutMapIcon sx={{ color: '#000', marginTop: '2px' }} />
          </IconButton>
        </CustomOverlay>

        <CustomOverlay>
          <IconButton onClick={onStartMapNoteCreation}>
            <FlagIcon
              color={'primary'}
              sx={{ color: creatingMarker ? '' : '#000', marginTop: '2px' }}
            />
          </IconButton>
        </CustomOverlay>

        {desktop && <MapPadding left={parseInt(theme.dimensions.drawerWidthDesktop, 10)} />}
      </Map>
      <Dialog open={createMapNoteDialogOpen} onClose={onCreateMapNoteDialogClose}>
        <DialogTitle>Nieuwe kaartnotitie</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Je staat op het punt een nieuwe kaartnotitie te maken. Geef een korte beschrijving.
          </DialogContentText>
          <TextField
            value={mapNoteDescription}
            onChange={onMapNoteDescriptionChange}
            label="Beschrijving"
            variant="standard"
            fullWidth
            margin="dense"
            autoFocus
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onCreateMapNote} variant="contained">
            Toevoegen
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
});

export default MainMap;
