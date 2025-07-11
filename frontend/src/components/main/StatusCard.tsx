import React, { useCallback, useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';

import CallIcon from '@mui/icons-material/Call';
import CloseIcon from '@mui/icons-material/Close';
import DirectionsIcon from '@mui/icons-material/Directions';
import EditLocationAltIcon from '@mui/icons-material/EditLocationAlt';
import HistoryIcon from '@mui/icons-material/History';
import InfoIcon from '@mui/icons-material/Info';
import StarIcon from '@mui/icons-material/Star';
import {
  Badge,
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
  Tooltip,
  Typography,
} from '@mui/material';

import { css } from '@emotion/react';

import {
  useGetCheckpointLogsQuery,
  useGetFichesQuery,
  useGetStatsQuery,
  useGetUserQuery,
} from '../../services/linker.ts';
import type { Team } from '../../services/types.ts';
import {
  selectSelectedMember,
  selectSelectedTeam,
  selectSelectedTracker,
  trackersActions,
  useAppDispatch,
  useAppSelector,
} from '../../store';
import { getLastCheckpointLog, getNavigationUrl } from '../../utils/data';
import {
  formatDateTimeLong,
  formatDateTimeShorter,
  formatFromNow,
  secondsToHoursMinutes,
} from '../../utils/time';
import PersonAvatar from '../PersonAvatar';
import SafeSelector from '../SafeSelector';
import MainCard from './MainCard.tsx';

const cell = css`
  border-bottom: none;
  padding-left: 0;
  padding-right: 0;
`;

function TeamRows({ team }: { team: Team }) {
  const { data: checkpointLogs } = useGetCheckpointLogsQuery();
  const { data: fiches } = useGetFichesQuery();
  const { data: user } = useGetUserQuery();
  const { data: stats } = useGetStatsQuery(undefined, {
    skip: !user || !user.permissions.includes('view_stats'),
  });

  const lastCheckpointLog = checkpointLogs && getLastCheckpointLog(team.id, checkpointLogs);
  const fiche = lastCheckpointLog && fiches && fiches.entities[lastCheckpointLog.fiche];
  const teamStats = stats && stats.teams[team.id];
  const canViewStats = Boolean(user && user.permissions.includes('view_stats'));
  const canViewTeamDetails = Boolean(user && user.permissions.includes('view_team_details'));

  return (
    <>
      {canViewTeamDetails && (
        <TableRow>
          <TableCell css={cell}>
            <Typography variant="body2">Laatste fiche</Typography>
          </TableCell>
          <TableCell css={cell}>
            <Typography variant="body2" color="textSecondary">
              {lastCheckpointLog && fiche
                ? `${fiche.display_name} (${formatDateTimeShorter(lastCheckpointLog.arrived)})`
                : '-'}
            </Typography>
          </TableCell>
        </TableRow>
      )}
      {canViewStats && (
        <TableRow>
          <TableCell css={cell}>
            <Typography variant="body2">Snelheid</Typography>
          </TableCell>
          <TableCell css={cell}>
            <Typography variant="body2" color="textSecondary">
              {teamStats && teamStats.avgPartialTochtDeviation
                ? secondsToHoursMinutes(teamStats.avgPartialTochtDeviation)
                : '-'}
            </Typography>
          </TableCell>
        </TableRow>
      )}
      {canViewTeamDetails && (
        <TableRow>
          <TableCell css={cell}>
            <Typography variant="body2">Safe</Typography>
          </TableCell>
          <TableCell css={cell}>
            <SafeSelector team={team} />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function TeamCallButton({ team }: { team: Team }) {
  const [anchorEl, setAnchorEl] = useState<Element | null>(null);

  const onClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => setAnchorEl(e.currentTarget),
    [],
  );
  const onClose = useCallback(() => setAnchorEl(null), []);

  return (
    <>
      <Tooltip title="Bellen">
        <IconButton onClick={onClick}>
          <CallIcon />
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={onClose}>
        {team.contact_persons.map((person) => (
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
}

interface StatusCardProps {
  onStartTrackerLogCreation: () => void;
  isCreatingTrackerLog: boolean;
}

export default function StatusCard({
  onStartTrackerLogCreation,
  isCreatingTrackerLog,
}: StatusCardProps) {
  const dispatch = useAppDispatch();
  const selectedTracker = useAppSelector(selectSelectedTracker);
  const selectedMember = useAppSelector(selectSelectedMember);
  const selectedTeam = useAppSelector(selectSelectedTeam);

  const { data: user } = useGetUserQuery();

  const lastLog = selectedTracker?.last_log;

  const navigateUrl = useMemo(
    () => getNavigationUrl(selectedTracker?.last_log?.point),
    [selectedTracker],
  );

  const canSeeContactPersons = Boolean(user && user.permissions.includes('view_contactperson'));
  const canViewTeamDetails = Boolean(user && user.permissions.includes('view_team_details'));
  const canViewTrackerLogs = Boolean(user && user.permissions.includes('view_trackerlog'));
  const canAddTrackerLog = Boolean(user && user.permissions.includes('add_trackerlog'));

  return (
    <MainCard sx={{ width: '360px' }}>
      <CardHeader
        avatar={
          <PersonAvatar
            item={selectedTeam || selectedMember}
            batteryPercentage={selectedTracker ? selectedTracker.battery_percentage : null}
          />
        }
        title={(selectedTeam || selectedMember)?.name}
        titleTypographyProps={{ noWrap: true }}
        subheader={selectedTeam?.chiro || ''}
        subheaderTypographyProps={{ noWrap: true }}
        action={
          <IconButton size="small" onClick={() => dispatch(trackersActions.deselect())}>
            <CloseIcon />
          </IconButton>
        }
      />

      <CardContent>
        <Table size="small">
          <TableBody>
            <TableRow>
              <TableCell css={cell}>
                <Typography variant="body2">Laatste update</Typography>
              </TableCell>
              <TableCell css={cell}>
                <Tooltip title={formatDateTimeLong(lastLog?.gps_datetime)} enterTouchDelay={0}>
                  <Typography variant="body2" color="textSecondary">
                    {formatFromNow(lastLog?.gps_datetime)}
                  </Typography>
                </Tooltip>
              </TableCell>
            </TableRow>
            {selectedTeam && <TeamRows team={selectedTeam} />}
          </TableBody>
        </Table>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-evenly', pt: 0.5 }} disableSpacing>
        <Tooltip title="Navigeer">
          <IconButton target="_blank" href={navigateUrl || ''} disabled={!navigateUrl}>
            <DirectionsIcon />
          </IconButton>
        </Tooltip>

        {canViewTrackerLogs && (
          <Tooltip title="Geschiedenis">
            <IconButton
              onClick={() => dispatch(trackersActions.setShowHistory(true))}
              disabled={!lastLog}
            >
              <HistoryIcon />
            </IconButton>
          </Tooltip>
        )}

        {canAddTrackerLog && (
          <Tooltip title="Manuele locatie">
            <IconButton
              onClick={onStartTrackerLogCreation}
              color={isCreatingTrackerLog ? 'primary' : 'default'}
            >
              <EditLocationAltIcon />
            </IconButton>
          </Tooltip>
        )}

        {selectedMember && (
          <>
            <Tooltip title="Bellen">
              <IconButton
                component="a"
                href={`tel:${selectedMember.phone_number}`}
                disabled={!selectedMember.phone_number}
              >
                <CallIcon />
              </IconButton>
            </Tooltip>
          </>
        )}

        {selectedTeam && canSeeContactPersons && <TeamCallButton team={selectedTeam} />}

        {selectedTeam && canViewTeamDetails && (
          <Tooltip title="Meer info">
            <IconButton component={RouterLink} to={`/team/${selectedTeam.id}/`}>
              <Badge badgeContent={selectedTeam.team_notes.length} color="primary">
                <InfoIcon />
              </Badge>
            </IconButton>
          </Tooltip>
        )}
      </CardActions>
    </MainCard>
  );
}
