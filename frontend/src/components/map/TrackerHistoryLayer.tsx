import { Layer, Source } from 'react-map-gl/maplibre';

import { red } from '@mui/material/colors';

import { skipToken } from '@reduxjs/toolkit/query';

import { useGetTrackerTrackQuery, useGetUserQuery } from '../../services/linker.ts';
import { selectSelectedItem, useAppSelector } from '../../store';

export default function TrackerHistoryLayer({ visible }: { visible: boolean }) {
  const selectedItem = useAppSelector(selectSelectedItem);
  const { data: user } = useGetUserQuery();
  const { currentData: track } = useGetTrackerTrackQuery(
    selectedItem?.tracker && user && user.permissions.includes('view_trackerlog')
      ? selectedItem.tracker
      : skipToken,
  );

  const trackData = track || { type: 'LineString', coordinates: [] };

  return (
    <Source data={trackData} type="geojson">
      <Layer
        id="tracker-history"
        beforeId="trackers"
        type="line"
        paint={{
          'line-color': red[500],
          'line-width': 4,
        }}
        layout={{ visibility: visible && track ? 'visible' : 'none' }}
      />
      <Layer
        id="tracker-history-outline"
        beforeId="tracker-history"
        type="line"
        paint={{
          'line-color': '#fff',
          'line-width': 6,
        }}
        layout={{ visibility: visible && track ? 'visible' : 'none' }}
      />
    </Source>
  );
}
