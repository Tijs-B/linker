import { memo, useCallback } from 'react';

import { FormControl, MenuItem, Select, SelectChangeEvent } from '@mui/material';

import { useGetUserQuery, useGetWeidesQuery, useUpdateTeamMutation } from '../services/linker.ts';
import { Team } from '../services/types.ts';

interface SafeSelectorProps {
  team: Team;
}

const SafeSelector = memo(function SafeSelector({ team }: SafeSelectorProps) {
  const { data: weides } = useGetWeidesQuery();
  const { data: user } = useGetUserQuery();
  const updateTeam = useUpdateTeamMutation()[0];

  const handleSafeChange = useCallback(
    (e: SelectChangeEvent<number | 'Unsafe'>) => {
      const safeWeide = e.target.value === 'Unsafe' ? null : e.target.value;
      // @ts-expect-error safeWeide is never a string here
      updateTeam({ id: team.id, safe_weide: safeWeide });
    },
    [team, updateTeam],
  );

  if (user === undefined || !user.permissions.includes('change_team')) {
    if (team.safe_weide === null || weides === undefined) {
      return 'Unsafe';
    } else {
      return weides.entities[team.safe_weide].display_name;
    }
  }

  return (
    <FormControl fullWidth size="small">
      <Select
        value={team.safe_weide === null ? 'Unsafe' : team.safe_weide}
        onChange={handleSafeChange}
      >
        <MenuItem value="Unsafe">Unsafe</MenuItem>
        {weides &&
          weides.ids.map((id) => (
            <MenuItem key={id} value={id}>
              {weides.entities[id].display_name}
            </MenuItem>
          ))}
      </Select>
    </FormControl>
  );
});

export default SafeSelector;
