import type { CSSProperties } from 'react';
import { useCallback, useMemo } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList } from 'react-window';

import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import { Badge, Chip, ListItem, ListItemAvatar, ListItemButton, ListItemText } from '@mui/material';

import { css } from '@emotion/react';

import {
  useGetBasisQuery,
  useGetFichesQuery,
  useGetForbiddenAreasQuery,
  useGetTochtenQuery,
  useGetTrackersQuery,
  useGetUserQuery,
  useGetWeidesQuery,
} from '../../services/linker.ts';
import type { OrganizationMember, Team } from '../../services/types.ts';
import { trackersActions, useAppDispatch } from '../../store';
import { getPositionDescription } from '../../utils/data';
import PersonAvatar from '../PersonAvatar';

type TrackerRowDataItem = (OrganizationMember | Team) & {
  secondary: string;
  isOnline: boolean;
  batteryPercentage: number | null;
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

  const safeChip = useMemo(() => {
    const item = data.items[index];
    if (!('safe_weide' in item) || !item.safe_weide) {
      return null;
    }
    if (item.safe_weide.trim().toLowerCase() === 'bus') {
      return <Chip color="warning" variant="outlined" icon={<DirectionsBusIcon />} label="Bus" />;
    }
    return <Chip color="primary" variant="filled" label={`Safe op ${item.safe_weide}`} />;
  }, [data, index]);

  const offlineIcon = useMemo(() => {
    const item = data.items[index];
    if (item.isOnline) {
      return null;
    }
    return <LinkOffIcon fontSize="small" sx={{ mr: 1 }} />;
  }, [data, index]);

  return (
    <div style={style}>
      <ListItem disablePadding dense>
        <ListItemButton onClick={onClick} sx={{ pl: 1.5, pr: 1.5 }}>
          <ListItemAvatar>
            <Badge badgeContent={'team_notes' in item ? item.team_notes.length : 0} color="primary">
              <PersonAvatar item={item} batteryPercentage={item.batteryPercentage} />
            </Badge>
          </ListItemAvatar>
          <ListItemText
            primary={item.name}
            secondary={item.secondary}
            slotProps={{
              primary: { noWrap: true },
              secondary: { noWrap: true },
            }}
          />
          {offlineIcon}
          {safeChip}
        </ListItemButton>
      </ListItem>
    </div>
  );
};

interface TrackerListProps {
  onClick: (tracker: number) => void;
  members: OrganizationMember[];
  teams: Team[];
}

export default function TrackerList({ members, teams, onClick }: TrackerListProps) {
  const { data: fiches } = useGetFichesQuery();
  const { data: tochten } = useGetTochtenQuery();
  const { data: weides } = useGetWeidesQuery();
  const { data: basis } = useGetBasisQuery();
  const { data: forbiddenAreas } = useGetForbiddenAreasQuery();
  const { data: trackers } = useGetTrackersQuery();
  const { data: user } = useGetUserQuery();

  const items = useMemo(() => {
    const canViewTeamDetails = Boolean(user && user.permissions.includes('view_team_details'));

    let allItems;
    if (canViewTeamDetails) {
      allItems = [...teams, ...members];
    } else {
      allItems = members;
    }
    return allItems.map((item: Team | OrganizationMember) => {
      const result: TrackerRowDataItem = {
        secondary: '-',
        isOnline: false,
        batteryPercentage: null,
        ...item,
      };
      if (!canViewTeamDetails) {
        return result;
      } else if (!item.tracker) {
        result.secondary = '⚠️ Geen tracker gekoppeld';
      } else if (
        fiches &&
        tochten &&
        weides &&
        basis &&
        forbiddenAreas &&
        trackers &&
        item.tracker
      ) {
        const tracker = trackers.entities[item.tracker];
        result.isOnline = tracker.is_online;
        result.batteryPercentage = tracker.battery_percentage;
        if (tracker.last_log) {
          result.secondary = getPositionDescription(
            tracker,
            fiches,
            tochten,
            weides,
            forbiddenAreas,
          );
        }
      }
      return result;
    });
  }, [user, teams, members, fiches, tochten, weides, basis, forbiddenAreas, trackers]);

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
