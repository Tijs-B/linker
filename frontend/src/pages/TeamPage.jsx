import {useMemo, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CallIcon from '@mui/icons-material/Call';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import {
    AppBar,
    Avatar,
    Container,
    Grid,
    IconButton,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Paper,
    Snackbar,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Toolbar,
    Typography,
} from '@mui/material';

import {teamColor} from '../theme/colors.js';
import {useGetCheckpointLogsQuery, useGetFichesQuery, useGetTeamsQuery, useGetTochtenQuery} from "../services/linker.js";

export default function TeamPage() {
    const navigate = useNavigate();
    const {teamId} = useParams();

    const {data: teams} = useGetTeamsQuery();
    const {data: checkpointLogs} = useGetCheckpointLogsQuery();
    const {data: fiches} = useGetFichesQuery();
    const {data: tochten} = useGetTochtenQuery();

    const [copied, setCopied] = useState();

    const team = teams?.entities[Number(teamId)];

    const teamLogs = useMemo(() => {
        if (!checkpointLogs || !fiches || !teams || !tochten) {
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
    }, [checkpointLogs, fiches, teams, tochten]);

    if (!team) {
        return <div>Team not found</div>;
    }

    const code = team.number.toString().padStart(2, '0');

    return (
        <>
            <AppBar position="sticky" color="inherit">
                <Toolbar>
                    <IconButton sx={{mr: 2}} onClick={() => navigate(-1)} color="inherit">
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
                    <Grid item xs={12} md={8}>
                        <Paper>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Fiche</TableCell>
                                        <TableCell>Type</TableCell>
                                        <TableCell>Tijd</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {teamLogs.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell>{log.ficheName}</TableCell>
                                            <TableCell>{log.type}</TableCell>
                                            <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Paper>
                            <Container>
                                <Typography variant="h6" sx={{pt: 2}}>
                                    Leden
                                </Typography>
                                <List dense>
                                    {team.contact_persons.map((person) => (
                                        <ListItem
                                            key={person.id}
                                            disablePadding
                                            secondaryAction={
                                                <IconButton
                                                    edge="end"
                                                    disabled={!person.phone_number}
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(person.phone_number);
                                                        setCopied(true);
                                                    }}
                                                >
                                                    <ContentCopyIcon/>
                                                </IconButton>
                                            }
                                        >
                                            <ListItemButton
                                                component="a"
                                                href={`tel:${person.phone_number}`}
                                                disabled={!person.phone_number}
                                            >
                                                <ListItemIcon>
                                                    <CallIcon/>
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={person.name}
                                                    secondary={person.phone_number ? person.phone_number : '-'}
                                                />
                                            </ListItemButton>
                                        </ListItem>
                                    ))}
                                </List>
                            </Container>
                        </Paper>
                    </Grid>
                </Grid>
            </Container>
            <Snackbar
                open={copied}
                onClose={() => setCopied(false)}
                autoHideDuration={2000}
                message="Gekopiëerd!"
            />
        </>
    );
}
