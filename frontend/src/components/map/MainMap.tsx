import { useCallback, useEffect, useRef, useState } from 'react';
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

import * as pmtiles from 'pmtiles';
import bbox from '@turf/bbox';
import { feature, featureCollection } from '@turf/helpers';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import {
  useGetOrganizationMembersQuery,
  useGetTeamsQuery,
  useGetTochtenQuery,
} from '../../services/linker.ts';
import { OrganizationMember, Team } from '../../services/types.ts';
import { trackersActions, useAppDispatch } from '../../store';
import { darkStyle } from '../../styles/dark.ts';
import { outdoorStyle } from '../../styles/outdoor.ts';
import { satelliteStyle } from '../../styles/satellite.ts';
import { generateAllIcons } from '../../utils/icons.ts';
import BackgroundLayers from './BackgroundLayers.tsx';
import CustomOverlay from './CustomOverlay.tsx';
import MapNoteLayer from './MapNoteLayer.tsx';
import MapPadding from './MapPadding.tsx';
import TrackerHistoryLayer from './TrackerHistoryLayer.tsx';
import TrackerLayer from './TrackerLayer.tsx';

const BOUNDS_OPTIONS = { padding: { top: 30, left: 30, right: 30, bottom: 30 } };
const DEFAULT_INITIAL_BOUNDS = {
  bounds: [5.709597, 50.298247, 5.832838, 50.358745] as [number, number, number, number],
  fitBoundsOptions: BOUNDS_OPTIONS,
};

interface MainMapProps {
  filteredTeams: Team[];
  filteredMembers: OrganizationMember[];
  creatingMarker: boolean;
  creatingMapNote: boolean;
  onCreateMarker: (position: LngLat) => void;
  onToggleMapNoteCreation: () => void;
}

export default function MainMap({
  filteredTeams,
  filteredMembers,
  creatingMarker,
  creatingMapNote,
  onCreateMarker,
  onToggleMapNoteCreation,
}: MainMapProps) {
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const dispatch = useAppDispatch();

  const [cursor, setCursor] = useState('inherit');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showSatellite, setShowSatellite] = useState(false);
  const [iconsAdded, setIconsAdded] = useState(false);
  const [showZijwegen, setShowZijwegen] = useState(false);

  const mapRef = useRef<MapRef>(null);
  const { data: tochten } = useGetTochtenQuery();
  const { data: teams } = useGetTeamsQuery();
  const { data: members } = useGetOrganizationMembersQuery();

  const mapStyle = showHeatmap ? darkStyle : showSatellite ? satelliteStyle : outdoorStyle;

  useEffect(() => {
    const protocol = new pmtiles.Protocol();
    maplibregl.addProtocol('pmtiles', protocol.tile);
    return () => {
      maplibregl.removeProtocol('pmtiles');
    };
  }, []);

  const addIcons = useCallback(() => {
    if (teams && members) {
      const allItems = [...Object.values(teams.entities), ...Object.values(members.entities)];
      generateAllIcons(allItems, (name, image) => {
        if (mapRef.current && !mapRef.current.hasImage(name)) {
          mapRef.current.addImage(name, image);
        }
      });
    }
  }, [mapRef, teams, members]);

  useEffect(() => {
    if (teams && members && mapRef && mapRef.current && !iconsAdded) {
      setIconsAdded(true);
      addIcons();
    }
  }, [iconsAdded, members, teams, mapRef, addIcons]);

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
      addIcons();
    } else {
      setShowHeatmap(true);
      setShowSatellite(false);
    }
  }, [showHeatmap, addIcons]);

  const onToggleSatellite = useCallback(() => {
    if (showSatellite) {
      setShowSatellite(false);
      addIcons();
    } else {
      setShowSatellite(true);
      setShowHeatmap(false);
      addIcons();
    }
  }, [showSatellite, addIcons]);

  const onResetBounds = useCallback(() => {
    if (mapRef.current && tochten) {
      const features = Object.values(tochten.entities).map((tocht) => feature(tocht.route));
      if (features.length === 0) {
        return;
      }
      const bounds = bbox(featureCollection(features)) as [number, number, number, number];
      mapRef.current.fitBounds(bounds, BOUNDS_OPTIONS);
    }
  }, [mapRef, tochten]);

  const onMapClick = useCallback(
    (event: MapLayerMouseEvent) => {
      if (creatingMarker) {
        onCreateMarker(event.lngLat);
      } else {
        dispatch(trackersActions.setShowHistory(false));
        dispatch(trackersActions.deselect());
      }
    },
    [creatingMarker, dispatch, onCreateMarker],
  );

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
        cursor={creatingMarker ? 'crosshair' : cursor}
        ref={mapRef}
        interactiveLayerIds={['trackers', 'map-notes']}
        styleDiffing={false}
        // maxPitch={85}
        // terrain={{source: 'relief', exaggeration: 2}}
        // fog={{range: [2,12], color: 'white', 'horizon-blend': 0.1}}
        onLoad={addIcons}
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
          <IconButton onClick={onToggleMapNoteCreation}>
            <FlagIcon
              color={'primary'}
              sx={{ color: creatingMapNote ? '' : '#000', marginTop: '2px' }}
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
      </Map>
    </>
  );
}
