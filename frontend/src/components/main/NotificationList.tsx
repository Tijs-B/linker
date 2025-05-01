import { CSSProperties, useCallback, useMemo } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList } from 'react-window';

import Battery1BarIcon from '@mui/icons-material/Battery1Bar';
import CheckIcon from '@mui/icons-material/Check';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import LockIcon from '@mui/icons-material/Lock';
import SosIcon from '@mui/icons-material/Sos';
import SportsBarIcon from '@mui/icons-material/SportsBar';
import {
  Avatar,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
} from '@mui/material';
import { grey, orange, red } from '@mui/material/colors';

import { css } from '@emotion/react';

import {
  useGetNotificationsQuery,
  useGetOrganizationMembersQuery,
  useGetTeamsQuery,
  useMarkNotificationAsReadMutation,
} from '../../services/linker.ts';
import { Notification, NotificationType, OrganizationMember, Team } from '../../services/types.ts';
import { trackersActions, useAppDispatch } from '../../store';
import { formatDateTimeShorter } from '../../utils/time.ts';

type NotificationRowDataItem = Notification & {
  team: Team | null;
  member: OrganizationMember | null;
};

interface NotificationRowProps {
  index: number;
  style: CSSProperties;
  data: {
    items: NotificationRowDataItem[];
    onTrackerClick: (tracker: number) => void;
    onMarkAsRead: (notification: number) => void;
  };
}

const NotificationRow = ({ data, index, style }: NotificationRowProps) => {
  const item = data.items[index];

  const onClick = useCallback(() => {
    const item = data.items[index];
    data.onTrackerClick(item.tracker);
  }, [data, index]);

  const onMarkAsRead = useCallback(() => {
    const item = data.items[index];
    data.onMarkAsRead(item.id);
  }, [data, index]);

  let icon;
  let title;
  switch (item.notification_type) {
    case NotificationType.TRACKER_OFFLINE:
      icon = <CloudOffIcon />;
      title = `Tracker offline`;
      break;
    case NotificationType.TRACKER_FAR_AWAY:
      icon = <SportsBarIcon />;
      title = `Tracker van 't padje`;
      break;
    case NotificationType.TRACKER_SOS:
      icon = <SosIcon />;
      title = `SOS tracker`;
      break;
    case NotificationType.TRACKER_LOW_BATTERY:
      icon = <Battery1BarIcon />;
      title = `Tracker batterij`;
      break;
    case NotificationType.TRACKER_IN_FORBIDDEN_AREA:
      icon = <LockIcon />;
      title = `Tracker in verboden gebied`;
      break;
  }

  if (item.team) {
    title = `G${item.team.code} ${title}`;
  } else if (item.member) {
    title = `${item.member.code} ${title}`;
  }

  return (
    <div style={style}>
      <ListItem
        disablePadding
        dense
        secondaryAction={
          <IconButton edge="end" onClick={onMarkAsRead} disabled={item.read}>
            <CheckIcon />
          </IconButton>
        }
        sx={{ bgcolor: item.read ? 'inherit' : grey[100] }}
      >
        <ListItemButton onClick={onClick}>
          <ListItemAvatar>
            <Avatar sx={{ bgcolor: item.severity === 1 ? red[500] : orange[500] }}>{icon}</Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={title}
            secondary={formatDateTimeShorter(item.sent)}
            slotProps={{
              primary: { noWrap: true, fontWeight: item.read ? 'regular' : 'bold' },
              secondary: { noWrap: true },
            }}
          />
        </ListItemButton>
      </ListItem>
    </div>
  );
};

interface NotificationListProps {
  onTrackerClick: (tracker: number) => void;
}

export default function NotificationList({ onTrackerClick }: NotificationListProps) {
  const { data: notifications } = useGetNotificationsQuery();
  const { data: teams } = useGetTeamsQuery();
  const { data: members } = useGetOrganizationMembersQuery();
  const markAsRead = useMarkNotificationAsReadMutation()[0];

  const dispatch = useAppDispatch();

  const items = useMemo(() => {
    if (!teams || !members || !notifications) {
      return [];
    }

    return notifications.map((notification) => {
      const team = Object.values(teams.entities).find((t) => t.tracker === notification.tracker);
      const member = Object.values(members.entities).find(
        (m) => m.tracker === notification.tracker,
      );

      return {
        team: team || null,
        member: member || null,
        ...notification,
      };
    });
  }, [notifications, teams, members]);

  const onClick = useCallback(
    (tracker: number) => {
      onTrackerClick(tracker);
      if (teams) {
        const team = Object.values(teams.entities).find((t) => t.tracker === tracker);
        if (team) {
          dispatch(trackersActions.selectTeam(team.id));
        } else if (members) {
          const member = Object.values(members.entities).find((m) => m.tracker === tracker);
          if (member) {
            dispatch(trackersActions.selectMember(member.id));
          }
        }
      }
    },
    [dispatch, onTrackerClick, teams, members],
  );

  const onMarkAsRead = useCallback(
    (notification: number) => {
      markAsRead(notification);
    },
    [markAsRead],
  );

  if (items.length === 0) {
    return (
      <List>
        <ListItem>
          <ListItemButton>
            <ListItemText primary="Geen meldingen"></ListItemText>
          </ListItemButton>
        </ListItem>
      </List>
    );
  }

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
          itemCount={notifications ? notifications.length : 0}
          itemData={{ items: items, onTrackerClick: onClick, onMarkAsRead: onMarkAsRead }}
          itemSize={60}
        >
          {NotificationRow}
        </FixedSizeList>
      )}
    </AutoSizer>
  );
}
