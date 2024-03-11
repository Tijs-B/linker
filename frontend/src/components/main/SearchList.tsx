import { CSSProperties, memo, useCallback, useMemo } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList } from 'react-window';



import { Badge, Chip, ListItem, ListItemAvatar, ListItemButton, ListItemText } from '@mui/material';



import { css } from '@emotion/react';



import { useGetBasisQuery, useGetFichesQuery, useGetTochtenQuery, useGetTrackersQuery, useGetWeidesQuery } from '../../services/linker.ts';
import { OrganizationMember, Team } from '../../services/types.ts';
import { getPositionDescription } from '../../utils/data';
import PersonAvatar from '../PersonAvatar';


type TrackerRowDataItem = (OrganizationMember | Team) & {
  secondary: string;
};

interface TrackerRowProps {
  index: number;
  style: CSSProperties;
  data: { onClick: (tracker: number) => void; items: TrackerRowDataItem[] };
}

const TrackerRow = ({ data, index, style }: TrackerRowProps) => {
  const item = data.items[index];
  const onClick = useCallback(() => {
    const tracker = data.items[index].tracker;
    if (tracker) {
      data.onClick(tracker);
    }
  }, [index, data]);

  return (
    <div style={style}>
      <ListItem disablePadding dense>
        <ListItemButton onClick={onClick}>
          <ListItemAvatar>
            <Badge badgeContent={'team_notes' in item ? item.team_notes.length : 0} color="primary">
              <PersonAvatar item={item} />
            </Badge>
          </ListItemAvatar>
          <ListItemText
            primary={item.name}
            secondary={item.secondary}
            primaryTypographyProps={{ noWrap: true }}
            secondaryTypographyProps={{ noWrap: true }}
          />
          {'safe_weide' in item && item.safe_weide && (
            <Chip
              color="primary"
              variant="outlined"
              label={`Safe op ${item.safe_weide}`}
            />
          )}
        </ListItemButton>
      </ListItem>
    </div>
  );
};

interface SearchListProps {
  onClick: (tracker: number) => void;
  members: OrganizationMember[];
  teams: Team[];
}

export default memo(function SearchList({ members, teams, onClick }: SearchListProps) {
  const { data: fiches } = useGetFichesQuery();
  const { data: tochten } = useGetTochtenQuery();
  const { data: weides } = useGetWeidesQuery();
  const { data: basis } = useGetBasisQuery();
  const { data: trackers } = useGetTrackersQuery();
  

  const items = useMemo(() => {
    const allItems = [...teams, ...members];
    return allItems.map((item: Team | OrganizationMember) => {
      const result = { secondary: '', safe_weide: '', ...item };
      if (fiches && tochten && weides && basis && trackers && item.tracker) {
        const tracker = trackers.entities[item.tracker];
        if (tracker.last_log) {
          result.secondary = getPositionDescription(tracker, fiches, tochten, weides);
        }
      }
      if (weides && tochten && 'safe_weide' in item && item.safe_weide) {
        result.safe_weide = weides.entities[item.safe_weide].display_name;
      }
      return result;
    });
  }, [teams, members, fiches, tochten, weides, basis, trackers]);

  return (
    <AutoSizer
      css={css`
        max-height: 100%;
      `}
    >
      {({ height, width }) => (
        <FixedSizeList
          width={width}
          height={height}
          itemCount={items.length}
          itemData={{ items, onClick }}
          itemSize={60}
        >
          {TrackerRow}
        </FixedSizeList>
      )}
    </AutoSizer>
  );
});
