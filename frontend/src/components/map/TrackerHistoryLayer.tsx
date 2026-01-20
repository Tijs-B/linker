import { Layer, Source } from 'react-map-gl/maplibre';

import { red } from '@mui/material/colors';

import { skipToken } from '@reduxjs/toolkit/query';

import {
  useGetOrganizationMemberTrackQuery,
  useGetTeamTrackQuery,
  useGetUserQuery,
} from '../../services/linker.ts';
import { selectSelectedMember, selectSelectedTeam, useAppSelector } from '../../store';

export default function TrackerHistoryLayer({ visible }: { visible: boolean }) {
  const selectedTeam = useAppSelector(selectSelectedTeam);
  const selectedMember = useAppSelector(selectSelectedMember);

  const { data: user } = useGetUserQuery();
  const { currentData: teamTrack } = useGetTeamTrackQuery(
    selectedTeam && user && user.permissions.includes('view_position')
      ? selectedTeam.id
      : skipToken,
  );
  const { currentData: memberTrack } = useGetOrganizationMemberTrackQuery(
    selectedMember && user && user.permissions.includes('view_position')
      ? selectedMember.id
      : skipToken,
  );
  const track = teamTrack || memberTrack;
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
