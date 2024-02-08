import AutoSizer from 'react-virtualized-auto-sizer';
import {FixedSizeList} from 'react-window';

import {Avatar, ListItem, ListItemAvatar, ListItemButton, ListItemText} from '@mui/material';

import {css} from '@emotion/react';

import {memberColor, teamColor} from '../../theme/colors.js';
import {
    useGetBasisQuery,
    useGetFichesQuery,
    useGetTochtenQuery,
    useGetTrackersQuery,
    useGetWeidesQuery
} from "../../services/linker.js";
import {memo, useMemo} from "react";
import {getPositionDescription} from "../../utils/data.js";

const TrackerRow = ({data, index, style}) => {
    const item = data.items[index];

    return (
        <div style={style}>
            <ListItem disablePadding dense>
                <ListItemButton onClick={() => data.onClick(item.tracker)}>
                    <ListItemAvatar>
                        <Avatar
                            sx={{bgcolor: item.color, fontSize: item.code.length > 2 ? '1rem' : '1.25rem'}}
                        >
                            {item.code}
                        </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                        primary={item.primary}
                        secondary={item.secondary}
                        primaryTypographyProps={{noWrap: true}}
                        secondaryTypographyProps={{noWrap: true}}
                    />
                </ListItemButton>
            </ListItem>
        </div>
    );
};

export default memo(function SearchList({members, teams, onClick}) {
    const {data: fiches} = useGetFichesQuery();
    const {data: tochten} = useGetTochtenQuery();
    const {data: weides} = useGetWeidesQuery();
    const {data: basis} = useGetBasisQuery();
    const {data: trackers} = useGetTrackersQuery();

    const items = useMemo(() =>
        teams
            .map((team) => {
                return {
                    color: teamColor(team),
                    code: team.number.toString().padStart(2, '0'),
                    primary: team.name,
                    tracker: team.tracker,
                };
            })
            .concat(
                members.map((m) => ({
                    color: memberColor(m),
                    code: m.code,
                    primary: m.name,
                    tracker: m.tracker,
                })),
            )
            .map((item) => {
                let secondary = '';
                if (fiches && tochten && weides && basis && trackers) {
                    let tracker = trackers.entities[item.tracker];
                    if (tracker.last_log) {
                        secondary = getPositionDescription(tracker.last_log.point, fiches, tochten, weides, basis);
                    }
                }
                return {
                    secondary,
                    ...item
                }
            }), [teams, members, fiches, tochten, weides, basis, trackers])

    return (
        <AutoSizer
            css={css`
                max-height: 100%;
            `}
        >
            {({height, width}) => (
                <FixedSizeList
                    width={width}
                    height={height}
                    itemCount={items.length}
                    itemData={{items, onClick}}
                    itemSize={60}
                >
                    {TrackerRow}
                </FixedSizeList>
            )}
        </AutoSizer>
    );
})
