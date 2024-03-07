import {memo, useCallback} from "react";
import {FormControl, MenuItem, Select} from "@mui/material";
import {useGetTochtenQuery, useGetWeidesQuery, useUpdateTeamMutation} from "../services/linker.js";

const SafeSelector = memo(function SafeSelector({team}) {
    const {data: tochten} = useGetTochtenQuery();
    const {data: weides} = useGetWeidesQuery();
    const updateTeam = useUpdateTeamMutation()[0];

    const handleSafeChange = useCallback((e) => {
        const safeWeide = e.target.value === 'Unsafe' ? null : e.target.value;
        updateTeam({id: team.id, safe_weide: safeWeide});
    }, [team, updateTeam]);

    return (
        <FormControl fullWidth size="small">
            <Select
                value={team.safe_weide || 'Unsafe'}
                onChange={handleSafeChange}
            >
                <MenuItem value="Unsafe">Unsafe</MenuItem>
                {tochten && weides && weides.ids.map(id => (
                        <MenuItem
                            key={id}
                            value={id}
                        >
                            {tochten.entities[weides.entities[id].tocht].identifier}
                        </MenuItem>
                    )
                )}
            </Select>
        </FormControl>
    )
});

export default SafeSelector;