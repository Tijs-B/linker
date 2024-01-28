import {useSelector} from 'react-redux';
import AutoSizer from 'react-virtualized-auto-sizer';
import {FixedSizeList} from 'react-window';

import {Avatar, ListItem, ListItemAvatar, ListItemButton, ListItemText} from '@mui/material';

import {css} from '@emotion/react';

import {itemColor, memberColor, teamColor} from '../../theme/colors.js';
import {getLastCheckpointLog} from '../../utils/data.js';
import {useGetCheckpointLogsQuery, useGetFichesQuery, useGetTochtenQuery} from "../../services/linker.js";

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

export default function SearchList({members, teams, onClick}) {
    const {data: checkpointLogs} = useGetCheckpointLogsQuery();
    const {data: fiches} = useGetFichesQuery();
    const {data: tochten} = useGetTochtenQuery();

    const items = teams
        .map((team) => {
            const lastCheckpointLog = getLastCheckpointLog(team, Object.values(checkpointLogs.entities));
            const fiche = lastCheckpointLog && fiches?.entities[lastCheckpointLog.fiche];
            const tocht = fiche && tochten?.entities[fiche.tocht];
            return {
                color: teamColor(team),
                code: team.number.toString().padStart(2, '0'),
                primary: team.name,
                secondary: lastCheckpointLog
                    ? `${tocht?.identifier}${fiche?.order}`
                    : ' ',
                tracker: team.tracker,
            };
        })
        .concat(
            members.map((m) => ({
                color: memberColor(m),
                code: m.code,
                primary: m.name,
                secondary: null,
                tracker: m.tracker,
            })),
        );

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
}
