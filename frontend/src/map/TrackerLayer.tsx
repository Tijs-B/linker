import { memo, useEffect, useMemo } from 'react';
import { Layer, MapLayerMouseEvent, Source, useMap } from 'react-map-gl/maplibre';

import { feature, featureCollection } from '@turf/helpers';
import { MapStyleImageMissingEvent } from 'maplibre-gl';

import {
  useGetOrganizationMembersQuery,
  useGetTeamsQuery,
  useGetTrackersQuery,
} from '../services/linker.ts';
import { trackersActions, useAppDispatch, useAppSelector } from '../store/index.js';
import { itemColor } from '../theme/colors.ts';
import { generateTracker, generateTrackerOutline } from '../utils/icons.ts';

interface TrackerLayerProps {
  visible: boolean;
  trackers: number[];
}

const TrackerLayer = memo(function TrackerLayer({ visible, trackers }: TrackerLayerProps) {
  const dispatch = useAppDispatch();
  const selectedId = useAppSelector((state) => state.trackers.selectedId);
  const showHistory = useAppSelector((state) => state.trackers.showHistory);

  const historyLog = useAppSelector((state) => state.trackers.historyLog);

  const { data: teams } = useGetTeamsQuery();
  const { data: organizationMembers } = useGetOrganizationMembersQuery();
  const { data: allTrackers } = useGetTrackersQuery();

  const { mainMap } = useMap();

  useEffect(() => {
    if (!mainMap) {
      return;
    }
    const onClick = (event: MapLayerMouseEvent) => {
      if (event.features) {
        const features = [...event.features];
        features.sort((a, b) => b.properties.sortKey - a.properties.sortKey);
        if (features[0] && features[0].id) {
          // @ts-expect-error id is always a number here
          dispatch(trackersActions.setSelectedId(features[0].id));
        }
      }
    };

    const onImageMissing = function (event: MapStyleImageMissingEvent) {
      const id = event.id;
      const prefix = 'trackermarker-';
      if (id.includes(prefix)) {
        const [code, color] = id.replace(prefix, '').split('-');
        const icon = generateTracker(code, color);
        if (icon) {
          mainMap.addImage(id, icon);
        }
      } else if (id === 'trackermarkerbackground') {
        const icon = generateTrackerOutline();
        if (icon) {
          mainMap.addImage('trackermarkerbackground', icon);
        }
      }
    };

    mainMap.on('click', 'trackers', onClick);
    mainMap.on('styleimagemissing', onImageMissing);

    return () => {
      mainMap.off('click', 'trackers', onClick);
      mainMap.off('styleimagemissing', onImageMissing);
    };
  }, [mainMap, dispatch]);

  const geoJsonData = useMemo(() => {
    if (!teams || !organizationMembers || !allTrackers || !trackers) {
      return featureCollection([]);
    }
    const trackerIds = historyLog && selectedId ? [selectedId] : trackers;
    const features = trackerIds.flatMap((trackerId) => {
      const lastLog = allTrackers?.entities[trackerId]?.last_log;
      if (!lastLog) {
        return [];
      }
      const team = Object.values(teams.entities).find((t) => t.tracker === trackerId);
      const member = Object.values(organizationMembers.entities).find(
        (m) => m.tracker === trackerId,
      );
      const item = team || member;
      if (!item) {
        return [];
      }
      const code = team ? team.number.toString().padStart(2, '0') : member ? member.code : '-';
      const point = historyLog ? historyLog.point : lastLog.point;
      const props = {
        image: `trackermarker-${code}-${itemColor(item)}`,
        sortKey: selectedId === item.tracker ? 100 : 100 - point.coordinates[1],
      };
      return [feature(point, props, { id: item.tracker! })];
    });
    return featureCollection(features);
  }, [teams, organizationMembers, allTrackers, selectedId, historyLog, trackers]);

  const selectedData = useMemo(() => {
    if (
      !showHistory &&
      selectedId &&
      allTrackers &&
      allTrackers.entities[selectedId].last_log !== null
    ) {
      return featureCollection([feature(allTrackers.entities[selectedId].last_log!.point)]);
    } else {
      return featureCollection([]);
    }
  }, [allTrackers, selectedId, showHistory]);

  return (
    <>
      <Source type="geojson" data={selectedData}>
        <Layer
          type="symbol"
          id="trackerBackground"
          beforeId="map-notes"
          layout={{
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
            'icon-image': 'trackermarkerbackground',
            'icon-offset': [0, -16.5 * 2],
            'icon-size': 0.5,
            visibility: visible ? 'visible' : 'none',
          }}
        />
      </Source>
      <Source type="geojson" data={geoJsonData}>
        <Layer
          type="symbol"
          id="trackers"
          beforeId="trackerBackground"
          layout={{
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
            'icon-image': ['get', 'image'],
            'icon-offset': [0, -16.5 * 2],
            'icon-size': 0.5,
            'symbol-sort-key': ['get', 'sortKey'],
            visibility: visible ? 'visible' : 'none',
          }}
        />
      </Source>
    </>
  );
});

export default TrackerLayer;
