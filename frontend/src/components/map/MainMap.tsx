import { memo, useCallback, useEffect, useRef, useState } from 'react';
import Map, {
  GeolocateControl,
  LngLat,
  MapLayerMouseEvent,
  MapRef,
  NavigationControl,
  ScaleControl,
} from 'react-map-gl/maplibre';

import CallSplitIcon from '@mui/icons-material/CallSplit';
import FlagIcon from '@mui/icons-material/Flag';
import SatelliteIcon from '@mui/icons-material/Satellite';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap';
import { IconButton, useMediaQuery, useTheme } from '@mui/material';

import bbox from '@turf/bbox';
import { feature, featureCollection } from '@turf/helpers';
import 'maplibre-gl/dist/maplibre-gl.css';

import {
  useGetOrganizationMembersQuery,
  useGetTeamsQuery,
  useGetTochtenQuery,
} from '../../services/linker.ts';
import { OrganizationMember, Team } from '../../services/types.ts';
import { trackersActions, useAppDispatch } from '../../store';
import { generateAllIcons } from '../../utils/icons.ts';
import CreateMapNoteDialog from '../main/CreateMapNoteDialog.tsx';
import BackgroundLayers from './BackgroundLayers.tsx';
import CustomOverlay from './CustomOverlay.tsx';
import MapNoteLayer from './MapNoteLayer.tsx';
import MapPadding from './MapPadding.tsx';
import TrackerHistoryLayer from './TrackerHistoryLayer.tsx';
import TrackerLayer from './TrackerLayer.tsx';

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
  const [initialBounds, setInitialBounds] = useState(DEFAULT_INITIAL_BOUNDS);
  const [iconsAdded, setIconsAdded] = useState(true);
  const [showZijwegen, setShowZijwegen] = useState(false);

  const mapRef = useRef<MapRef>(null);
  const { data: tochten } = useGetTochtenQuery();
  const { data: teams } = useGetTeamsQuery();
  const { data: members } = useGetOrganizationMembersQuery();

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
      } else {
        dispatch(trackersActions.setShowHistory(false));
        dispatch(trackersActions.deselect());
      }
    },
    [creatingMarker, dispatch],
  );

  const onCreateMapNoteCompleted = useCallback(() => {
    setMapNoteLngLat(null);
  }, []);

  const onMapLoad = useCallback(() => setIconsAdded(false), []);

  const onToggleZijwegen = useCallback(() => setShowZijwegen((s) => !s), []);

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
        reuseMaps
      >
        <BackgroundLayers
          showHeatmap={showHeatmap}
          showZijwegen={showZijwegen}
          showSatellite={showSatellite}
        />

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

        <CustomOverlay>
          <IconButton onClick={onToggleZijwegen}>
            <CallSplitIcon
              color={'primary'}
              sx={{ color: showZijwegen ? '' : '#000', marginTop: '2px' }}
            />
          </IconButton>
        </CustomOverlay>

        {desktop && <MapPadding left={parseInt(theme.dimensions.drawerWidthDesktop, 10)} />}
        <CreateMapNoteDialog location={mapNoteLngLat} onComplete={onCreateMapNoteCompleted} />
      </Map>
    </>
  );
});

export default MainMap;
