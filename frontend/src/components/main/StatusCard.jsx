import {useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {useNavigate} from 'react-router-dom';

import CallIcon from '@mui/icons-material/Call';
import CloseIcon from '@mui/icons-material/Close';
import DirectionsIcon from '@mui/icons-material/Directions';
import EditNoteIcon from '@mui/icons-material/EditNote';
import HistoryIcon from '@mui/icons-material/History';
import InfoIcon from '@mui/icons-material/Info';
import SatelliteAltIcon from '@mui/icons-material/SatelliteAlt';
import StarIcon from '@mui/icons-material/Star';
import {
    Avatar,
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
    Stack,
    Table,
    TableBody,
    TableCell,
    TableRow,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material';

import {css} from '@emotion/react';

import {trackersActions} from '../../store/index.js';
import {itemColor} from '../../theme/colors.js';
import {getLastCheckpointLog} from '../../utils/data.js';
import {
    useGetCheckpointLogsQuery,
    useGetFichesQuery, useGetOrganizationMembersQuery,
    useGetTeamsQuery,
    useGetTrackersQuery
} from "../../services/linker.js";

const cell = css`
    border-bottom: none;
    padding-left: 0;
    padding-right: 0;
`;

function TeamRows({team}) {
    const {data: checkpointLogs} = useGetCheckpointLogsQuery();
    const {data: fiches} = useGetFichesQuery();

    const lastCheckpointLog = getLastCheckpointLog(team, checkpointLogs.entities);
    const formattedDate = lastCheckpointLog
        ? new Date(lastCheckpointLog.timestamp).toLocaleTimeString()
        : '-';
    const fiche = lastCheckpointLog && fiches.entities[lastCheckpointLog.fiche];

    return (
        <TableRow>
            <TableCell css={cell}>
                <Typography variant="body2">Laatste fiche</Typography>
            </TableCell>
            <TableCell css={cell}>
                <Stack direction="row" gap={2}>
                    <Typography variant="body2" color="textSecondary">
                        {lastCheckpointLog ? `${fiche.tocht}${fiche.order} om ${formattedDate}` : '-'}
                    </Typography>
                    {lastCheckpointLog &&
                        (lastCheckpointLog.type === 'automated' ? (
                            <SatelliteAltIcon fontSize="small"/>
                        ) : (
                            <EditNoteIcon fontSize="small"/>
                        ))}
                </Stack>
            </TableCell>
        </TableRow>
    );
}

export default function StatusCard() {
    const theme = useTheme();
    const desktop = useMediaQuery(theme.breakpoints.up('md'));

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
    `;

    const actions = css`
        justify-content: space-evenly;
        padding-top: ${theme.spacing(0.5)};
    `;

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState(null);
    const selectedId = useSelector((state) => state.trackers.selectedId);

    const {data: trackers} = useGetTrackersQuery();
    const {data: teams} = useGetTeamsQuery();
    const {data: organizationMembers} = useGetOrganizationMembersQuery();

    const tracker = trackers && trackers.entities[selectedId];
    const team = teams && Object.values(teams.entities).find((t) => t.tracker === selectedId);
    const member = organizationMembers && Object.values(organizationMembers.entities).find((m) => m.tracker === selectedId);

    const code = member ? member.code : team.number.toString().padStart(2, '0');

    const [longitude, latitude] = tracker.last_log.point.coordinates;
    const navigateUrl = desktop
        ? `https://www.google.com/maps/search/?api=1&query=${latitude}%2C${longitude}`
        : `geo:${latitude},${longitude}`;

    const lastUpdate = tracker.last_log
        ? new Date(tracker.last_log.gps_datetime).toLocaleTimeString()
        : '-';

    return (
        <div css={root}>
            <Card css={card}>
                <CardHeader
                    avatar={
                        <Avatar
                            sx={{
                                bgcolor: itemColor(team || member),
                                fontSize: code.length > 2 ? '16px' : '20px',
                            }}
                        >
                            {code}
                        </Avatar>
                    }
                    title={team?.name || member?.name}
                    titleTypographyProps={{noWrap: true}}
                    subheader={team?.chiro}
                    subheaderTypographyProps={{noWrap: true}}
                    sx={{
                        display: 'flex',
                        overflow: 'hidden',
                        '& .MuiCardHeader-content': {
                            overflow: 'hidden',
                        },
                    }}
                    action={
                        <IconButton size="small" onClick={() => dispatch(trackersActions.setSelectedId(null))}>
                            <CloseIcon/>
                        </IconButton>
                    }
                    css={header}
                />

                <CardContent css={content}>
                    <Table size="small">
                        <TableBody>
                            {team && <TeamRows team={team}/>}
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
                        </TableBody>
                    </Table>
                </CardContent>

                <CardActions css={actions} disableSpacing>
                    <IconButton target="_blank" href={navigateUrl}>
                        <DirectionsIcon/>
                    </IconButton>

                    <IconButton onClick={() => dispatch(trackersActions.setShowHistory(true))}>
                        <HistoryIcon/>
                    </IconButton>

                    {team && (
                        <>
                            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
                                <CallIcon/>
                            </IconButton>
                            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                                {team.contact_persons
                                    .filter((p) => p.phone_number)
                                    .map((person) => (
                                        <MenuItem key={person.id} component="a" href={`tel:${person.phone_number}`}>
                                            {person.is_leader && (
                                                <ListItemIcon>
                                                    <StarIcon/>
                                                </ListItemIcon>
                                            )}
                                            <ListItemText>{person.name}</ListItemText>
                                        </MenuItem>
                                    ))}
                            </Menu>
                            <IconButton onClick={() => navigate(`/team/${team.id}`)}>
                                <Badge badgeContent={team.team_notes.length} color="primary">
                                    <InfoIcon/>
                                </Badge>
                            </IconButton>
                        </>
                    )}
                    {member && (
                        <IconButton
                            component="a"
                            href={`tel:${member.phone_number}`}
                            disabled={!member.phone_number}
                        >
                            <CallIcon/>
                        </IconButton>
                    )}
                </CardActions>
            </Card>
        </div>
    );
}
