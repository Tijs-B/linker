import { useEffect, useMemo } from 'react';
import type { MapLayerMouseEvent } from 'react-map-gl/maplibre';
import { Layer, Source, useMap } from 'react-map-gl/maplibre';

import { feature, featureCollection } from '@turf/helpers';

import type { OrganizationMember, Team } from '../../services/types.ts';
import { PositionSource } from '../../services/types.ts';
import { selectSelectedItem, trackersActions, useAppDispatch, useAppSelector } from '../../store';
import { itemColor } from '../../theme/colors.ts';

interface TrackerLayerProps {
  visible: boolean;
  filteredTeams: Team[];
  filteredMembers: OrganizationMember[];
  trackersClickable: boolean;
}

// The three icon families are named by prefix (e.g. `phone-A1-#f00`,
// `hand-offline-outline`, `tracker-outline`), keyed off the position source.
function iconPrefixForSource(source: PositionSource | null): string {
  return source === PositionSource.PHONE_GPS
    ? 'phone'
    : source === PositionSource.MANUAL
      ? 'hand'
      : 'tracker';
}

export default function TrackerLayer({
  visible,
  filteredTeams,
  filteredMembers,
  trackersClickable,
}: TrackerLayerProps) {
  const dispatch = useAppDispatch();
  const selectedItem = useAppSelector(selectSelectedItem);
  const showHistory = useAppSelector((state) => state.trackers.showHistory);

  const historyItem = useAppSelector((state) => state.trackers.historyItem);

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
    const allItems =
      historyItem && selectedItem ? [selectedItem] : [...filteredMembers, ...filteredTeams];

    const features = [];
    const offlineFeatures = [];

    for (const item of allItems) {
      const currentPoint = historyItem?.point || item.last_position_point;
      if (!currentPoint) {
        continue;
      }

      // In history mode the marker shows a past position, so use that position's
      // source rather than the item's current one.
      const source = historyItem ? historyItem.source : item.last_position_source;
      const iconPrefix = iconPrefixForSource(source);
      const props = {
        image: `${iconPrefix}-${item.code}-${itemColor(item)}`,
        sortKey: selectedItem === item ? 100 : 100 - currentPoint.coordinates[1],
        action:
          'member_type' in item
            ? trackersActions.selectMember(item.id)
            : trackersActions.selectTeam(item.id),
      };

      features.push(feature(currentPoint, props));

      if (!item.is_online) {
        offlineFeatures.push(
          feature(currentPoint, { outlineImage: `${iconPrefix}-offline-outline` }),
        );
      }
    }
    return [featureCollection(features), featureCollection(offlineFeatures)];
  }, [filteredMembers, filteredTeams, historyItem, selectedItem]);

  const selectedData = useMemo(() => {
    if (!showHistory && selectedItem?.last_position_point) {
      const outlineImage = `${iconPrefixForSource(selectedItem.last_position_source)}-outline`;
      return featureCollection([feature(selectedItem.last_position_point, { outlineImage })]);
    } else {
      return featureCollection([]);
    }
  }, [selectedItem, showHistory]);

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
            'icon-image': ['get', 'outlineImage'],
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
            'icon-image': ['get', 'outlineImage'],
            'icon-offset': [0, -16.5 * 2],
            'icon-size': 0.5,
            visibility: visible && !showHistory ? 'visible' : 'none',
          }}
        />
      </Source>
    </>
  );
}
