import React, { memo, useCallback, useMemo, useState } from 'react';
import { useMap } from 'react-map-gl/maplibre';
import { Link as RouterLink } from 'react-router-dom';

import CallIcon from '@mui/icons-material/Call';
import CloseIcon from '@mui/icons-material/Close';
import DirectionsIcon from '@mui/icons-material/Directions';
import HistoryIcon from '@mui/icons-material/History';
import InfoIcon from '@mui/icons-material/Info';
import SearchIcon from '@mui/icons-material/Search';
import StarIcon from '@mui/icons-material/Star';
import {
  Badge,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
  useTheme,
} from '@mui/material';

import { css } from '@emotion/react';

import {
  useGetCheckpointLogsQuery,
  useGetFichesQuery,
  useGetStatsQuery,
  useGetTrackersQuery,
} from '../../services/linker.ts';
import { Team } from '../../services/types.ts';
import { selectSelectedItem, trackersActions, useAppDispatch, useAppSelector } from '../../store';
import { getLastCheckpointLog, getNavigationUrl } from '../../utils/data';
import { secondsToHoursMinutes } from '../../utils/time';
import PersonAvatar from '../PersonAvatar';
import SafeSelector from '../SafeSelector';

const cell = css`
  border-bottom: none;
  padding-left: 0;
  padding-right: 0;
`;

function TeamRows({ team }: { team: Team }) {
  const { data: checkpointLogs } = useGetCheckpointLogsQuery();
  const { data: fiches } = useGetFichesQuery();
  const { data: stats } = useGetStatsQuery();

  const lastCheckpointLog = checkpointLogs && getLastCheckpointLog(team.id, checkpointLogs);
  const formattedDate = lastCheckpointLog
    ? new Date(lastCheckpointLog.arrived).toLocaleTimeString()
    : '-';
  const fiche = lastCheckpointLog && fiches && fiches.entities[lastCheckpointLog.fiche];
  const teamStats = stats && stats.teams[team.id];

  return (
    <>
      <TableRow>
        <TableCell css={cell}>
          <Typography variant="body2">Laatste fiche</Typography>
        </TableCell>
        <TableCell css={cell}>
          <Typography variant="body2" color="textSecondary">
            {lastCheckpointLog && fiche ? `${fiche.display_name} om ${formattedDate}` : '-'}
          </Typography>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell css={cell}>
          <Typography variant="body2">Gem. afwijking voor tochten</Typography>
        </TableCell>
        <TableCell css={cell}>
          <Typography variant="body2" color="textSecondary">
            {teamStats && teamStats.avgPartialTochtDeviation
              ? secondsToHoursMinutes(teamStats.avgPartialTochtDeviation)
              : '-'}
          </Typography>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell css={cell}>
          <Typography variant="body2">Gem. afwijking voor fiches</Typography>
        </TableCell>
        <TableCell css={cell}>
          <Typography variant="body2" color="textSecondary">
            {teamStats && teamStats.avgFicheDeviation
              ? secondsToHoursMinutes(teamStats.avgFicheDeviation)
              : '-'}
          </Typography>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell css={cell}>
          <Typography variant="body2">Safe</Typography>
        </TableCell>
        <TableCell css={cell}>
          <SafeSelector team={team} />
        </TableCell>
      </TableRow>
    </>
  );
}

const TeamCallButton = memo(function () {
  const [anchorEl, setAnchorEl] = useState<Element | null>(null);
  const selectedItem = useAppSelector(selectSelectedItem);

  const onClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => setAnchorEl(e.currentTarget),
    [],
  );
  const onClose = useCallback(() => setAnchorEl(null), []);

  if (!selectedItem || !('contact_persons' in selectedItem)) {
    return null;
  }

  return (
    <>
      <IconButton onClick={onClick}>
        <CallIcon />
      </IconButton>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={onClose}>
        {selectedItem.contact_persons.map((person) => (
          <MenuItem key={person.id} component="a" href={`tel:${person.phone_number}`}>
            {person.is_favorite && (
              <ListItemIcon>
                <StarIcon />
              </ListItemIcon>
            )}
            <ListItemText>{person.name}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
});

const StatusCard = memo(function StatusCard() {
  const theme = useTheme();
  const { mainMap } = useMap();

  const dispatch = useAppDispatch();
  const selectedItem = useAppSelector(selectSelectedItem);

  const { data: trackers } = useGetTrackersQuery();

  const root = css`
    pointer-events: none;
    position: fixed;
    z-index: 5;
    left: 50%;

    ${theme.breakpoints.up('md')} {
      left: calc(50% + ${theme.dimensions.drawerWidthDesktop} / 2);
      bottom: ${theme.spacing(3)};
    }

    ${theme.breakpoints.down('md')} {
      left: 50%;
      bottom: calc(${theme.spacing(3)} + 56px);
    }

    transform: translateX(-50%);
  `;

  const card = css`
    pointer-events: auto;
    width: ${theme.dimensions.popupMaxWidth};
  `;

  const content = css`
    padding-top: ${theme.spacing(1)};
    padding-bottom: ${theme.spacing(1)};
  `;

  const header = css`
    padding-top: ${theme.spacing(1.5)};
    padding-bottom: ${theme.spacing(0.5)};
    display: flex;
    overflow: hidden;

    & .MuiCardHeader-content {
      overflow: hidden;
    }
  `;

  const actions = css`
    justify-content: space-evenly;
    padding-top: ${theme.spacing(0.5)};
  `;

  const tracker =
    trackers && selectedItem?.tracker ? trackers.entities[selectedItem.tracker] : null;
  const lastLog = tracker && tracker.last_log;
  const lastUpdate = lastLog ? new Date(lastLog.gps_datetime).toLocaleTimeString() : '-';
  const trackerIsOnline = tracker ? tracker.is_online : false;

  const navigateUrl = useMemo(() => {
    const tracker =
      trackers && selectedItem?.tracker ? trackers.entities[selectedItem.tracker] : null;
    const last_log = tracker && tracker.last_log;
    return getNavigationUrl(last_log?.point);
  }, [selectedItem, trackers]);

  const focusMap = useCallback(() => {
    const tracker =
      trackers && selectedItem?.tracker ? trackers.entities[selectedItem.tracker] : null;
    const last_log = tracker && tracker.last_log;
    if (mainMap && last_log) {
      mainMap.easeTo({
        // @ts-expect-error the point always has two coordinates
        center: last_log.point.coordinates,
        zoom: 14,
      });
    }
  }, [mainMap, selectedItem, trackers]);

  return (
    <div css={root}>
      <Card css={card}>
        <CardHeader
          avatar={<PersonAvatar item={selectedItem} isOnline={trackerIsOnline} />}
          title={selectedItem?.name}
          titleTypographyProps={{ noWrap: true }}
          subheader={selectedItem && 'chiro' in selectedItem ? selectedItem.chiro : ''}
          subheaderTypographyProps={{ noWrap: true }}
          action={
            <IconButton size="small" onClick={() => dispatch(trackersActions.deselect())}>
              <CloseIcon />
            </IconButton>
          }
          css={header}
        />

        <CardContent css={content}>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell css={cell}>
                  <Typography variant="body2">Laatste update</Typography>
                </TableCell>
                <TableCell css={cell}>
                  <Typography variant="body2" color="textSecondary">
                    {lastUpdate}
                  </Typography>
                </TableCell>
              </TableRow>
              {selectedItem && 'chiro' in selectedItem && <TeamRows team={selectedItem} />}
            </TableBody>
          </Table>
        </CardContent>

        <CardActions css={actions} disableSpacing>
          <IconButton target="_blank" href={navigateUrl} disabled={!lastLog}>
            <DirectionsIcon />
          </IconButton>

          <IconButton onClick={focusMap} disabled={!lastLog}>
            <SearchIcon />
          </IconButton>

          <IconButton
            onClick={() => dispatch(trackersActions.setShowHistory(true))}
            disabled={!lastLog}
          >
            <HistoryIcon />
          </IconButton>

          <TeamCallButton />

          {selectedItem && 'phone_number' in selectedItem && (
            <IconButton
              component="a"
              href={`tel:${selectedItem.phone_number}`}
              disabled={!selectedItem.phone_number}
            >
              <CallIcon />
            </IconButton>
          )}

          {selectedItem && 'team_notes' in selectedItem && (
            <IconButton component={RouterLink} to={`/team/${selectedItem.id}/`}>
              <Badge badgeContent={selectedItem.team_notes.length} color="primary">
                <InfoIcon />
              </Badge>
            </IconButton>
          )}
        </CardActions>
      </Card>
    </div>
  );
});

export default StatusCard;
