import { useEffect, useMemo } from 'react';
import type { MapLayerMouseEvent } from 'react-map-gl/maplibre';
import { Layer, Source, useMap } from 'react-map-gl/maplibre';

import { feature, featureCollection } from '@turf/helpers';

import { useGetTrackersQuery } from '../../services/linker.ts';
import type { OrganizationMember, Team } from '../../services/types.ts';
import {
  selectSelectedItem,
  selectSelectedTracker,
  trackersActions,
  useAppDispatch,
  useAppSelector,
} from '../../store';
import { itemColor } from '../../theme/colors.ts';

interface TrackerLayerProps {
  visible: boolean;
  filteredTeams: Team[];
  filteredMembers: OrganizationMember[];
  trackersClickable: boolean;
}

export default function TrackerLayer({
  visible,
  filteredTeams,
  filteredMembers,
  trackersClickable,
}: TrackerLayerProps) {
  const dispatch = useAppDispatch();
  const selectedItem = useAppSelector(selectSelectedItem);
  const selectedTracker = useAppSelector(selectSelectedTracker);
  const showHistory = useAppSelector((state) => state.trackers.showHistory);

  const historyLog = useAppSelector((state) => state.trackers.historyLog);

  const { data: allTrackers } = useGetTrackersQuery();

  const { mainMap } = useMap();

  useEffect(() => {
    if (!mainMap) {
      return;
    }
    const onClick = (event: MapLayerMouseEvent) => {
      if (trackersClickable && event.features) {
        const features = [...event.features];
        features.sort((a, b) => b.properties.sortKey - a.properties.sortKey);
        if (features[0]) {
          // See https://github.com/maplibre/maplibre-gl-js/issues/1325
          dispatch(JSON.parse(features[0].properties.action));
        }
      }
    };

    mainMap.on('click', 'trackers', onClick);

    return () => {
      mainMap.off('click', 'trackers', onClick);
    };
  }, [mainMap, dispatch, trackersClickable]);

  const [trackerData, offlineData] = useMemo(() => {
    if (!allTrackers) {
      return [featureCollection([]), featureCollection([])];
    }
    const allItems =
      historyLog && selectedItem?.tracker ? [selectedItem] : [...filteredMembers, ...filteredTeams];

    const features = [];
    const offlineFeatures = [];

    for (const item of allItems) {
      if (item.tracker === null) {
        continue;
      }
      const tracker = allTrackers!.entities[item.tracker!];
      const lastLog = tracker?.last_log;
      const currentLog = historyLog || lastLog;
      if (!currentLog) {
        continue;
      }

      const props = {
        image: `tracker-${item.code}-${itemColor(item)}`,
        sortKey: selectedItem === item ? 100 : 100 - currentLog.point.coordinates[1],
        action:
          'member_type' in item
            ? trackersActions.selectMember(item.id)
            : trackersActions.selectTeam(item.id),
      };

      features.push(feature(currentLog.point, props));

      if (!tracker.is_online) {
        offlineFeatures.push(feature(currentLog.point));
      }
    }
    return [featureCollection(features), featureCollection(offlineFeatures)];
  }, [allTrackers, filteredMembers, filteredTeams, historyLog, selectedItem]);

  const selectedData = useMemo(() => {
    if (!showHistory && selectedTracker?.last_log) {
      return featureCollection([feature(selectedTracker.last_log.point)]);
    } else {
      return featureCollection([]);
    }
  }, [selectedTracker, showHistory]);

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
            'icon-image': 'tracker-outline',
            'icon-offset': [0, -16.5 * 2],
            'icon-size': 0.5,
            visibility: visible ? 'visible' : 'none',
          }}
        />
      </Source>
      <Source type="geojson" data={trackerData}>
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
      <Source type="geojson" data={offlineData}>
        <Layer
          type="symbol"
          id="trackerOffline"
          beforeId="trackers"
          layout={{
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
            'icon-image': 'tracker-offline-outline',
            'icon-offset': [0, -16.5 * 2],
            'icon-size': 0.5,
            visibility: visible && !showHistory ? 'visible' : 'none',
          }}
        />
      </Source>
    </>
  );
}
