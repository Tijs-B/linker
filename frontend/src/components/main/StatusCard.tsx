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
  Tooltip,
  Typography,
  useTheme,
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
      <IconButton onClick={onClick}>
        <CallIcon />
      </IconButton>
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
  const theme = useTheme();

  const dispatch = useAppDispatch();
  const selectedTracker = useAppSelector(selectSelectedTracker);
  const selectedMember = useAppSelector(selectSelectedMember);
  const selectedTeam = useAppSelector(selectSelectedTeam);

  const { data: user } = useGetUserQuery();

  const root = css`
    pointer-events: none;
    position: fixed;
    z-index: 5;
    left: 50%;
    transform: translateX(-50%);

    ${theme.breakpoints.up('md')} {
      left: calc(50% + ${theme.dimensions.drawerWidthDesktop} / 2);
      bottom: ${theme.spacing(3)};
    }

    ${theme.breakpoints.down('md')} {
      left: 50%;
      bottom: calc(${theme.spacing(3)} + 56px);
    }
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

  const lastLog = selectedTracker?.last_log;
  const trackerIsOnline = Boolean(selectedTracker) && selectedTracker!.is_online;

  const navigateUrl = useMemo(() => {
    return getNavigationUrl(selectedTracker?.last_log?.point);
  }, [selectedTracker]);

  return (
    <div css={root}>
      <Card css={card}>
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

        <CardActions css={actions} disableSpacing>
          <IconButton target="_blank" href={navigateUrl || ''} disabled={!navigateUrl}>
            <DirectionsIcon />
          </IconButton>

          <IconButton
            onClick={() => dispatch(trackersActions.setShowHistory(true))}
            disabled={!lastLog}
          >
            <HistoryIcon />
          </IconButton>

          {selectedTeam && <TeamCallButton team={selectedTeam} />}

          {selectedMember && (
            <>
              {user && user.is_staff && (
                <IconButton href={`/admin/people/organizationmember/${selectedMember.id}/change/`}>
                  <SettingsIcon />
                </IconButton>
              )}
              <IconButton
                component="a"
                href={`tel:${selectedMember.phone_number}`}
                disabled={!selectedMember.phone_number}
              >
                <CallIcon />
              </IconButton>
            </>
          )}

          {selectedTeam && (
            <>
              {user && user.is_staff && (
                <IconButton href={`/admin/people/team/${selectedTeam.id}/change/`}>
                  <SettingsIcon />
                </IconButton>
              )}
              <IconButton component={RouterLink} to={`/team/${selectedTeam.id}/`}>
                <Badge badgeContent={selectedTeam.team_notes.length} color="primary">
                  <InfoIcon />
                </Badge>
              </IconButton>
            </>
          )}
        </CardActions>
      </Card>
    </div>
  );
});

export default StatusCard;
