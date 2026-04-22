import { useCallback, useMemo } from 'react';
import { List } from 'react-window';
import { type RowComponentProps } from 'react-window';

import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import { Badge, Chip, ListItem, ListItemAvatar, ListItemButton, ListItemText } from '@mui/material';

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
  items: TrackerRowDataItem[];
  onItemClick: (item: Team | OrganizationMember) => void;
}

const TrackerRow = ({ items, index, style, onItemClick }: RowComponentProps<TrackerRowProps>) => {
  const item = items[index];
  const dispatch = useAppDispatch();

  const onClick = useCallback(() => {
    const item = items[index];
    if ('member_type' in item) {
      dispatch(trackersActions.selectMember(item.id));
    } else {
      dispatch(trackersActions.selectTeam(item.id));
    }
    onItemClick(item);
  }, [items, dispatch, index, onItemClick]);

  const safeChip = useMemo(() => {
    const item = items[index];
    if (!('last_safety_location' in item) || !item.last_safety_location) {
      return null;
    }
    if (item.last_safety_location.trim().toLowerCase() === 'bus') {
      return <Chip color="warning" variant="outlined" icon={<DirectionsBusIcon />} label="Bus" />;
    }
    return <Chip color="primary" variant="filled" label={`Safe op ${item.last_safety_location}`} />;
  }, [items, index]);

  const offlineIcon = useMemo(() => {
    const item = items[index];
    if (item.isOnline) {
      return null;
    }
    return <LinkOffIcon fontSize="small" sx={{ mr: 1 }} />;
  }, [items, index]);

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
  onItemClick: (item: Team | OrganizationMember) => void;
  members: OrganizationMember[];
  teams: Team[];
}

export default function TrackerList({ members, teams, onItemClick }: TrackerListProps) {
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
        result.isOnline = item.is_online;
        result.batteryPercentage = tracker.battery_percentage;
        if (item.last_position_point) {
          result.secondary = getPositionDescription(item, fiches, tochten, weides, forbiddenAreas);
        }
      }
      return result;
    });
  }, [user, teams, members, fiches, tochten, weides, basis, forbiddenAreas, trackers]);

  return (
    <List
      rowCount={items.length}
      rowComponent={TrackerRow}
      rowHeight={60}
      rowProps={{ items, onItemClick }}
    />
  );
}
