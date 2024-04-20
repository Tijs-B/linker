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
import isMobile from 'is-mobile';

import {
  useGetCheckpointLogsQuery,
  useGetFichesQuery,
  useGetOrganizationMembersQuery,
  useGetStatsQuery,
  useGetTeamsQuery,
  useGetTrackersQuery,
} from '../../services/linker.ts';
import { Team } from '../../services/types.ts';
import { trackersActions, useAppDispatch, useAppSelector } from '../../store';
import { getLastCheckpointLog } from '../../utils/data';
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
            {teamStats && teamStats.avgTochtDeviation
              ? secondsToHoursMinutes(teamStats.avgTochtDeviation)
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
  const selectedId = useAppSelector((state) => state.trackers.selectedId);
  const { data: teams } = useGetTeamsQuery();
  const [anchorEl, setAnchorEl] = useState<Element | null>(null);

  const team = useMemo(
    () => teams && Object.values(teams.entities).find((t) => t.tracker === selectedId),
    [selectedId, teams],
  );

  const onClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => setAnchorEl(e.currentTarget),
    [],
  );
  const onClose = useCallback(() => setAnchorEl(null), []);

  const items = useMemo(
    () =>
      team
        ? team.contact_persons
            .filter((p) => p.phone_number)
            .map((person) => (
              <MenuItem key={person.id} component="a" href={`tel:${person.phone_number}`}>
                {person.is_favorite && (
                  <ListItemIcon>
                    <StarIcon />
                  </ListItemIcon>
                )}
                <ListItemText>{person.name}</ListItemText>
              </MenuItem>
            ))
        : null,
    [team],
  );

  if (!team) {
    return null;
  }
  return (
    <>
      <IconButton onClick={onClick}>
        <CallIcon />
      </IconButton>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={onClose}>
        {items}
      </Menu>
    </>
  );
});

const StatusCard = memo(function StatusCard() {
  const theme = useTheme();
  const { mainMap } = useMap();

  const dispatch = useAppDispatch();
  const selectedId = useAppSelector((state) => state.trackers.selectedId);

  const { data: trackers } = useGetTrackersQuery();
  const { data: teams } = useGetTeamsQuery();
  const { data: organizationMembers } = useGetOrganizationMembersQuery();

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

  const tracker = trackers && selectedId && trackers.entities[selectedId];
  const team = teams && Object.values(teams.entities).find((t) => t.tracker === selectedId);
  const member =
    organizationMembers &&
    Object.values(organizationMembers.entities).find((m) => m.tracker === selectedId);

  const last_log = tracker && tracker.last_log;

  const navigateUrl = useMemo(() => {
    const tracker = trackers && selectedId && trackers.entities[selectedId];
    const last_log = tracker && tracker.last_log;
    const [longitude, latitude] = last_log ? last_log.point.coordinates : [null, null];
    return isMobile({ tablet: true, featureDetect: true })
      ? `geo:${latitude},${longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${latitude}%2C${longitude}`;
  }, [selectedId, trackers]);

  const lastUpdate = last_log ? new Date(last_log.gps_datetime).toLocaleTimeString() : '-';

  const focusMap = useCallback(() => {
    const tracker = trackers && selectedId && trackers.entities[selectedId];
    const last_log = tracker && tracker.last_log;
    if (mainMap && last_log) {
      mainMap.easeTo({
        // @ts-expect-error the point always has two coordinates
        center: last_log.point.coordinates,
        zoom: 14,
      });
    }
  }, [mainMap, selectedId, trackers]);

  return (
    <div css={root}>
      <Card css={card}>
        <CardHeader
          avatar={<PersonAvatar item={team || member} />}
          title={team?.name || member?.name}
          titleTypographyProps={{ noWrap: true }}
          subheader={team?.chiro}
          subheaderTypographyProps={{ noWrap: true }}
          action={
            <IconButton size="small" onClick={() => dispatch(trackersActions.setSelectedId(null))}>
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
              {team && <TeamRows team={team} />}
            </TableBody>
          </Table>
        </CardContent>

        <CardActions css={actions} disableSpacing>
          <IconButton target="_blank" href={navigateUrl} disabled={!last_log}>
            <DirectionsIcon />
          </IconButton>

          <IconButton onClick={focusMap}>
            <SearchIcon />
          </IconButton>

          <IconButton onClick={() => dispatch(trackersActions.setShowHistory(true))}>
            <HistoryIcon />
          </IconButton>

          <TeamCallButton />

          {member && (
            <IconButton
              component="a"
              href={`tel:${member.phone_number}`}
              disabled={!member.phone_number}
            >
              <CallIcon />
            </IconButton>
          )}

          {team && (
            <IconButton component={RouterLink} to={`/team/${team.id}/`}>
              <Badge badgeContent={team.team_notes.length} color="primary">
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
