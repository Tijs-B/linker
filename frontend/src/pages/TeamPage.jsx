import React, {memo, useCallback, useMemo, useState} from 'react';
import {Link as RouterLink, useParams} from 'react-router-dom';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import {
    AppBar,
    Avatar, Button,
    Container,
    Grid,
    IconButton, List, ListItem, ListItemText,
    Paper, Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow, TextField,
    Toolbar,
    Typography,
} from '@mui/material';

import {teamColor} from '../theme/colors.js';
import {
    useCreateTeamNoteMutation,
    useDeleteTeamNoteMutation,
    useGetBasisQuery,
    useGetCheckpointLogsQuery,
    useGetFichesQuery, useGetStatsQuery,
    useGetTeamsQuery,
    useGetTochtenQuery, useGetTrackersQuery, useGetWeidesQuery
} from "../services/linker.js";
import ContactPersonsList from "../components/team/ContactPersonsList.jsx";
import {secondsToHoursMinutes} from "../utils/time.js";
import {getPositionDescription} from "../utils/data.js";
import SafeSelector from "../components/SafeSelector.jsx";

const TeamPage = memo(function TeamPage() {
    const {teamId} = useParams();

    const {data: teams} = useGetTeamsQuery();
    const {data: checkpointLogs} = useGetCheckpointLogsQuery();
    const {data: fiches} = useGetFichesQuery();
    const {data: tochten} = useGetTochtenQuery();
    const {data: weides} = useGetWeidesQuery();
    const {data: basis} = useGetBasisQuery();
    const {data: stats} = useGetStatsQuery();
    const {data: trackers} = useGetTrackersQuery();
    const deleteTeamNote = useDeleteTeamNoteMutation()[0];
    const createTeamNote = useCreateTeamNoteMutation()[0];

    const [newNoteText, setNewNoteText] = useState('');

    const team = teams?.entities[Number(teamId)];

    const teamLogs = useMemo(() => {
        if (!checkpointLogs || !fiches || !tochten) {
            return [];
        }
        let result = Object.values(checkpointLogs.entities)
            .filter((l) => l.team === Number(teamId))
            .map((l) => {
                let fiche = fiches.entities[l.fiche];
                let tocht = tochten.entities[fiche.tocht];
                return {
                    ficheName: `${tocht.identifier}${fiche.order}`,
                    ...l
                }
            })
        result.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        return result;
    }, [teamId, checkpointLogs, fiches, tochten]);

    const code = team?.number.toString().padStart(2, '0');

    const teamStats = stats && stats.teams[teamId];
    const positionDescription = useMemo(() => {
        if (!(teams && trackers && fiches && tochten && weides && basis)) {
            return '-';
        }
        const lastLog = trackers.entities[teams.entities[teamId].tracker].last_log;
        if (!lastLog || !lastLog.point) {
            return '-';
        }
        return getPositionDescription(lastLog.point, fiches, tochten, weides, basis);
    }, [teamId, teams, trackers, fiches, tochten, weides, basis]);

    const createNote = useCallback(() => {
        if (newNoteText) {
            createTeamNote({
                text: newNoteText,
                team: teamId,
            });
            setNewNoteText('');
        }
    }, [createTeamNote, newNoteText, teamId]);

    if (!team) {
        return <div>Team not found</div>;
    }

    return (
        <>
            <AppBar position="sticky" color="inherit">
                <Toolbar>
                    <IconButton sx={{mr: 2}} component={RouterLink} to={-1} color="inherit">
                        <ArrowBackIcon/>
                    </IconButton>
                    <Avatar sx={{bgcolor: teamColor(team), mr: 2}}>{code}</Avatar>
                    <Typography variant="h6" sx={{mr: 2}}>
                        {team.name}
                    </Typography>
                    <Typography variant="body2">{team.chiro}</Typography>
                </Toolbar>
            </AppBar>
            <Container sx={{pt: 2}}>
                <Grid container spacing={2}>
                    <Grid container item xs={12} md={8}>
                        <Stack flex="1 1 0" spacing={2}>
                            <Paper>
                                <Container sx={{pt: 2, pb: 2}}>
                                    <Typography variant="h6">
                                        Tracing
                                    </Typography>
                                    <Table>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell>Gem. afwijking voor tochten</TableCell>
                                                <TableCell>{secondsToHoursMinutes(teamStats?.avgTochtDeviation)}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell>Gem. afwijking voor fiches</TableCell>
                                                <TableCell>{secondsToHoursMinutes(teamStats?.avgFicheDeviation)}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell>Locatie</TableCell>
                                                <TableCell>{positionDescription}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell>Safe?</TableCell>
                                                <TableCell><SafeSelector team={team}/></TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </Container>
                            </Paper>
                            <Paper>
                                <Container sx={{pt: 2, pb: 2}}>
                                    <Typography variant="h6">
                                        Fiches
                                    </Typography>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Fiche</TableCell>
                                                <TableCell>Aankomst</TableCell>
                                                <TableCell>Vertrek</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {teamLogs.map((log) => (
                                                <TableRow key={log.id}>
                                                    <TableCell>{log.ficheName}</TableCell>
                                                    <TableCell>{new Date(log.arrived).toLocaleString()}</TableCell>
                                                    <TableCell>{new Date(log.left).toLocaleString()}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </Container>
                            </Paper>
                        </Stack>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Stack flex="1 1 0" spacing={2}>
                            <Paper>
                                <Container sx={{pt: 2, pb: 2}}>
                                    <Stack spacing={1}>
                                        <Typography variant="h6">
                                            Notities
                                        </Typography>
                                        {team.team_notes && (
                                            <List>
                                                {team.team_notes.map(note => (
                                                    <ListItem key={note.id} secondaryAction={(
                                                        <IconButton onClick={() => deleteTeamNote(note)}>
                                                            <DeleteIcon/>
                                                        </IconButton>
                                                    )}>
                                                        <ListItemText
                                                            primary={note.text}
                                                            secondary={new Date(note.created).toLocaleString()}
                                                        />
                                                    </ListItem>
                                                ))}
                                            </List>
                                        )}
                                        {team.team_notes.length === 0 && (
                                            <Typography variant="body2" color="textSecondary">
                                                Nog geen notities
                                            </Typography>
                                        )}
                                        <Stack direction="row" spacing={1}>
                                            <TextField
                                                value={newNoteText}
                                                onChange={(e) => setNewNoteText(e.target.value)}
                                                multiline
                                            />
                                            <Button variant="contained" onClick={createNote}>
                                                Post
                                            </Button>
                                        </Stack>
                                    </Stack>
                                </Container>
                            </Paper>
                            <Paper>
                                <Container sx={{pt: 2, pb: 2}}>
                                    <Typography variant="h6" >
                                        Leden
                                    </Typography>
                                    <ContactPersonsList team={team}/>
                                </Container>
                            </Paper>
                        </Stack>
                    </Grid>
                </Grid>
            </Container>
        </>
    );
});

export default TeamPage;
