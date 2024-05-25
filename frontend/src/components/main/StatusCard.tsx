import React, { memo, useCallback, useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';

import CallIcon from '@mui/icons-material/Call';
import CloseIcon from '@mui/icons-material/Close';
import DirectionsIcon from '@mui/icons-material/Directions';
import HistoryIcon from '@mui/icons-material/History';
import InfoIcon from '@mui/icons-material/Info';
import SettingsIcon from '@mui/icons-material/Settings';
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
import { Team } from '../../services/types.ts';
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
  const { data: stats } = useGetStatsQuery();

  const lastCheckpointLog = checkpointLogs && getLastCheckpointLog(team.id, checkpointLogs);
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
            {lastCheckpointLog && fiche
              ? `${fiche.display_name} (${formatDateTimeShorter(lastCheckpointLog.arrived)})`
              : '-'}
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

const TeamCallButton = memo(function ({ team }: { team: Team }) {
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
});

const StatusCard = memo(function StatusCard() {
  const dispatch = useAppDispatch();
  const selectedTracker = useAppSelector(selectSelectedTracker);
  const selectedMember = useAppSelector(selectSelectedMember);
  const selectedTeam = useAppSelector(selectSelectedTeam);

  const { data: user } = useGetUserQuery();

  const lastLog = selectedTracker?.last_log;
  const trackerIsOnline = Boolean(selectedTracker) && selectedTracker!.is_online;

  const navigateUrl = useMemo(() => {
    return getNavigationUrl(selectedTracker?.last_log?.point);
  }, [selectedTracker]);

  return (
    <MainCard sx={{ width: '360px' }}>
      <CardHeader
        avatar={<PersonAvatar item={selectedTeam || selectedMember} isOnline={trackerIsOnline} />}
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

        <Tooltip title="Geschiedenis">
          <IconButton
            onClick={() => dispatch(trackersActions.setShowHistory(true))}
            disabled={!lastLog}
          >
            <HistoryIcon />
          </IconButton>
        </Tooltip>

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
            {user && user.is_staff && (
              <Tooltip title="Admin">
                <IconButton href={`/admin/people/organizationmember/${selectedMember.id}/change/`}>
                  <SettingsIcon />
                </IconButton>
              </Tooltip>
            )}
          </>
        )}

        {selectedTeam && (
          <>
            <TeamCallButton team={selectedTeam} />
            {user && user.is_staff && (
              <Tooltip title="Admin">
                <IconButton href={`/admin/people/team/${selectedTeam.id}/change/`}>
                  <SettingsIcon />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Meer info">
              <IconButton component={RouterLink} to={`/team/${selectedTeam.id}/`}>
                <Badge badgeContent={selectedTeam.team_notes.length} color="primary">
                  <InfoIcon />
                </Badge>
              </IconButton>
            </Tooltip>
          </>
        )}
      </CardActions>
    </MainCard>
  );
});

export default StatusCard;
