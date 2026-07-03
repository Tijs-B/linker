import type { SyntheticEvent } from 'react';
import { useCallback, useMemo, useState } from 'react';

import { Autocomplete, FormControl, TextField } from '@mui/material';

import pointToPolygonDistance from '@turf/point-to-polygon-distance';
import dayjs from 'dayjs';

import { useGetUserQuery, useGetWeidesQuery, useUpdateTeamMutation } from '../services/linker.ts';
import { PositionSource } from '../services/types.ts';
import type { Team, Weide } from '../services/types.ts';
import AddManualPositionDialog from './AddManualPositionDialog.tsx';

interface SafeSelectorProps {
  team: Team;
}

const RECENT_TRACKER_POSITION_MINUTES = 10;
const NEARBY_WEIDE_METERS = 100;

function hasRecentTrackerPosition(team: Team): boolean {
  if (!team.last_position_timestamp || team.last_position_source === PositionSource.MANUAL) {
    return false;
  }
  return (
    dayjs().diff(dayjs(team.last_position_timestamp), 'minute') < RECENT_TRACKER_POSITION_MINUTES
  );
}

function isNearWeide(team: Team, weide: Weide): boolean {
  if (!team.last_position_point) {
    return false;
  }
  return (
    pointToPolygonDistance(team.last_position_point, weide.polygon, { units: 'meters' }) <
    NEARBY_WEIDE_METERS
  );
}

export default function SafeSelector({ team }: SafeSelectorProps) {
  const { data: weides } = useGetWeidesQuery();
  const { data: user } = useGetUserQuery();
  const updateTeam = useUpdateTeamMutation()[0];
  const [weideForPositionDialog, setWeideForPositionDialog] = useState<Weide | null>(null);

  const onPositionDialogComplete = useCallback(() => setWeideForPositionDialog(null), []);

  const onChange = useCallback(
    (_e: SyntheticEvent, value: string | null) => {
      const safeWeide = !value || value === 'Unsafe' ? '' : value;
      updateTeam({ id: team.id, last_safety_location: safeWeide });

      if (weides && safeWeide) {
        const weide = weides.ids.map((id) => weides.entities[id]).find((w) => w.name === value);
        if (weide && !hasRecentTrackerPosition(team) && !isNearWeide(team, weide)) {
          setWeideForPositionDialog(weide);
        }
      }
    },
    [team, updateTeam, weides],
  );

  const options = useMemo(() => {
    if (!weides) return [];
    const result = weides.ids.map((id) => weides.entities[id].name);
    result.unshift('Bus');
    result.unshift('Unsafe');
    return result;
  }, [weides]);

  if (!weides || !user || !user.permissions.includes('change_team')) {
    return team.last_safety_location || 'Unsafe';
  }

  return (
    <FormControl fullWidth size="small">
      <Autocomplete
        freeSolo
        options={options}
        value={team.last_safety_location || 'Unsafe'}
        onChange={onChange}
        renderInput={(params) => <TextField {...params} hiddenLabel size="small" />}
        selectOnFocus
      />
      <AddManualPositionDialog
        team={team}
        weide={weideForPositionDialog}
        onComplete={onPositionDialogComplete}
      />
    </FormControl>
  );
}
