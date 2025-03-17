import { CSSProperties, useCallback, useMemo } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList } from 'react-window';

import { Badge, Chip, ListItem, ListItemAvatar, ListItemButton, ListItemText } from '@mui/material';

import { css } from '@emotion/react';

import {
  useGetBasisQuery,
  useGetFichesQuery,
  useGetTochtenQuery,
  useGetTrackersQuery,
  useGetWeidesQuery,
} from '../../services/linker.ts';
import { OrganizationMember, Team } from '../../services/types.ts';
import { trackersActions, useAppDispatch } from '../../store';
import { getPositionDescription } from '../../utils/data';
import PersonAvatar from '../PersonAvatar';

type TrackerRowDataItem = (OrganizationMember | Team) & {
  secondary: string;
  isOnline: boolean;
};

interface TrackerRowProps {
  index: number;
  style: CSSProperties;
  data: { items: TrackerRowDataItem[]; onTrackerClick: (tracker: number) => void };
}

const TrackerRow = ({ data, index, style }: TrackerRowProps) => {
  const item = data.items[index];
  const dispatch = useAppDispatch();

  const onClick = useCallback(() => {
    const item = data.items[index];
    if ('member_type' in item) {
      dispatch(trackersActions.selectMember(item.id));
    } else {
      dispatch(trackersActions.selectTeam(item.id));
    }
    if (item.tracker) {
      data.onTrackerClick(item.tracker);
    }
  }, [data, dispatch, index]);

  return (
    <div style={style}>
      <ListItem disablePadding dense>
        <ListItemButton onClick={onClick}>
          <ListItemAvatar>
            <Badge badgeContent={'team_notes' in item ? item.team_notes.length : 0} color="primary">
              <PersonAvatar item={item} isOnline={item.isOnline} />
            </Badge>
          </ListItemAvatar>
          <ListItemText
            primary={item.name}
            secondary={item.secondary}
            primaryTypographyProps={{ noWrap: true }}
            secondaryTypographyProps={{ noWrap: true }}
          />
          {'safe_weide' in item && item.safe_weide && (
            <Chip color="primary" variant="filled" label={`Safe op ${item.safe_weide}`} />
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

export default function SearchList({ members, teams, onClick }: SearchListProps) {
  const { data: fiches } = useGetFichesQuery();
  const { data: tochten } = useGetTochtenQuery();
  const { data: weides } = useGetWeidesQuery();
  const { data: basis } = useGetBasisQuery();
  const { data: trackers } = useGetTrackersQuery();

  const items = useMemo(() => {
    const allItems = [...teams, ...members];
    return allItems.map((item: Team | OrganizationMember) => {
      const result = { secondary: '', safe_weide: '', isOnline: false, ...item };
      if (!item.tracker) {
        result.secondary = '⚠️ Geen tracker gekoppeld';
      } else if (fiches && tochten && weides && basis && trackers && item.tracker) {
        const tracker = trackers.entities[item.tracker];
        result.isOnline = tracker.is_online;
        if (tracker.last_log) {
          result.secondary = getPositionDescription(tracker, fiches, tochten, weides);
        }
      }
      if (weides && tochten && 'safe_weide' in item && item.safe_weide) {
        result.safe_weide = weides.entities[item.safe_weide].identifier;
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
          itemData={{ items, onTrackerClick: onClick }}
          itemSize={60}
        >
          {TrackerRow}
        </FixedSizeList>
      )}
    </AutoSizer>
  );
}
