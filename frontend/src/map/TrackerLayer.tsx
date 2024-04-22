import { memo, useEffect, useMemo } from 'react';
import { Layer, MapLayerMouseEvent, Source, useMap } from 'react-map-gl/maplibre';

import { feature, featureCollection } from '@turf/helpers';

import { useGetTrackersQuery } from '../services/linker.ts';
import { OrganizationMember, Team } from '../services/types.ts';
import {
  selectSelectedItem,
  trackersActions,
  useAppDispatch,
  useAppSelector,
} from '../store/index.js';
import { itemColor } from '../theme/colors.ts';

interface TrackerLayerProps {
  visible: boolean;
  filteredTeams: Team[];
  filteredMembers: OrganizationMember[];
}

const TrackerLayer = memo(function TrackerLayer({
  visible,
  filteredTeams,
  filteredMembers,
}: TrackerLayerProps) {
  const dispatch = useAppDispatch();
  const selectedItem = useAppSelector(selectSelectedItem);
  const showHistory = useAppSelector((state) => state.trackers.showHistory);

  const historyLog = useAppSelector((state) => state.trackers.historyLog);

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
  }, [mainMap, dispatch]);

  const geoJsonData = useMemo(() => {
    if (!allTrackers) {
      return featureCollection([]);
    }
    const allItems =
      historyLog && selectedItem?.tracker ? [selectedItem] : [...filteredMembers, ...filteredTeams];
    const features = allItems
      .filter((item) => item.tracker !== null)
      .flatMap((item) => {
        const lastLog = allTrackers!.entities[item.tracker!]?.last_log;
        const currentLog = historyLog || lastLog;
        if (!currentLog) {
          return [];
        }
        const props = {
          image: `tracker-${item.code}-${itemColor(item)}`,
          sortKey: selectedItem === item ? 100 : 100 - currentLog.point.coordinates[1],
          action:
            'member_type' in item
              ? trackersActions.selectMember(item.id)
              : trackersActions.selectTeam(item.id),
        };
        return [feature(currentLog.point, props)];
      });

    return featureCollection(features);
  }, [allTrackers, filteredMembers, filteredTeams, historyLog, selectedItem]);

  const selectedData = useMemo(() => {
    if (
      !showHistory &&
      selectedItem?.tracker &&
      allTrackers &&
      allTrackers.entities[selectedItem.tracker].last_log !== null
    ) {
      return featureCollection([
        feature(allTrackers.entities[selectedItem.tracker].last_log!.point),
      ]);
    } else {
      return featureCollection([]);
    }
  }, [allTrackers, selectedItem, showHistory]);

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
