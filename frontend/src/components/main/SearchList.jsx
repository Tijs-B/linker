import AutoSizer from 'react-virtualized-auto-sizer';
import {FixedSizeList} from 'react-window';

import {Badge, Chip, ListItem, ListItemAvatar, ListItemButton, ListItemText} from '@mui/material';

import {css} from '@emotion/react';

import {
    useGetBasisQuery,
    useGetFichesQuery,
    useGetTochtenQuery,
    useGetTrackersQuery,
    useGetWeidesQuery
} from "../../services/linker.js";
import {memo, useCallback, useMemo} from "react";
import {getPositionDescription} from "../../utils/data.js";
import PersonAvatar from "../PersonAvatar.jsx";

const TrackerRow = ({data, index, style}) => {
    const item = data.items[index];
    const onClick = useCallback(() => {
        data.onClick(data.items[index].tracker)
    }, [index, data])

    return (
        <div style={style}>
            <ListItem disablePadding dense>
                <ListItemButton onClick={onClick}>
                    <ListItemAvatar>
                        <Badge badgeContent={item.team_notes ? item.team_notes.length : 0} color="primary">
                            <PersonAvatar item={item}/>
                        </Badge>
                    </ListItemAvatar>
                    <ListItemText
                        primary={item.name}
                        secondary={item.secondary}
                        primaryTypographyProps={{noWrap: true}}
                        secondaryTypographyProps={{noWrap: true}}
                    />
                    {item.safe_weide && (
                        <Chip edge="end" color="primary" variant="outlined" label={`Safe op ${item.safe_weide}`}/>
                    )}
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
        teams.concat(members)
            .map((item) => {
                let result = {...item};
                if (fiches && tochten && weides && basis && trackers) {
                    let tracker = trackers.entities[item.tracker];
                    if (tracker.last_log) {
                        result.secondary = getPositionDescription(tracker.last_log.point, fiches, tochten, weides, basis);
                    }
                }
                if (weides && tochten && item.safe_weide) {
                    result.safe_weide = tochten.entities[weides.entities[result.safe_weide].tocht].identifier;
                }
                return result
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
