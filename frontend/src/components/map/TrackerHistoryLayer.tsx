import { memo } from 'react';
import { Layer, Source } from 'react-map-gl/maplibre';

import { red } from '@mui/material/colors';

import { skipToken } from '@reduxjs/toolkit/query';

import { useGetTrackerTrackQuery } from '../../services/linker.ts';
import { selectSelectedItem, useAppSelector } from '../../store';

const TrackerHistoryLayer = memo(function TrackerHistoryLayer({ visible }: { visible: boolean }) {
  const selectedItem = useAppSelector(selectSelectedItem);
  const { currentData: track } = useGetTrackerTrackQuery(
    selectedItem?.tracker ? selectedItem.tracker : skipToken,
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
});

export default TrackerHistoryLayer;
