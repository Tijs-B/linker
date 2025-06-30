import type { SyntheticEvent } from 'react';
import { useCallback, useMemo } from 'react';

import { Autocomplete, FormControl, TextField } from '@mui/material';

import { useGetUserQuery, useGetWeidesQuery, useUpdateTeamMutation } from '../services/linker.ts';
import type { Team } from '../services/types.ts';

interface SafeSelectorProps {
  team: Team;
}

export default function SafeSelector({ team }: SafeSelectorProps) {
  const { data: weides } = useGetWeidesQuery();
  const { data: user } = useGetUserQuery();
  const updateTeam = useUpdateTeamMutation()[0];

  const onChange = useCallback(
    (_e: SyntheticEvent, value: string | null) => {
      const safeWeide = !value || value === 'Unsafe' ? '' : value;
      updateTeam({ id: team.id, safe_weide: safeWeide });
    },
    [team, updateTeam],
  );

  const options = useMemo(() => {
    if (!weides) return [];
    const result = weides.ids.map((id) => weides.entities[id].name);
    result.unshift('Bus');
    result.unshift('Unsafe');
    return result;
  }, [weides]);

  if (!weides || !user || !user.permissions.includes('change_team')) {
    return team.safe_weide || 'Unsafe';
  }

  return (
    <FormControl fullWidth size="small">
      <Autocomplete
        freeSolo
        options={options}
        value={team.safe_weide || 'Unsafe'}
        onChange={onChange}
        renderInput={(params) => <TextField {...params} hiddenLabel size="small" />}
        selectOnFocus
      />
    </FormControl>
  );
}
