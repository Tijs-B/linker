import {
    AppBar,
    Container,
    IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Toolbar,
    Typography,
    Stack, Box,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack.js";
import {memo} from "react";
import {useNavigate} from "react-router-dom";
import {
    useGetCheckpointLogsQuery,
    useGetFichesQuery,
    useGetStatsQuery, useGetTeamsQuery,
    useGetTochtenQuery
} from "../services/linker.js";
import {ficheDisplay, getCheckpointLog, getNextFiche} from "../utils/data.js";
import {secondsToHoursMinutes, toHoursMinutes} from "../utils/time.js";


function TochtenTable({tochten, stats}) {
    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell/>
                        <TableCell>Rood</TableCell>
                        <TableCell>Blauw</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {tochten.ids.map(id => (
                        <TableRow key={id}>
                            <TableCell>{tochten.entities[id].identifier}</TableCell>
                            <TableCell>{secondsToHoursMinutes(stats.tochten[id].R.average)}</TableCell>
                            <TableCell>{secondsToHoursMinutes(stats.tochten[id].B.average)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    )
}

function ficheTimeToColor(time, min, max) {
    const percentage = (time - min) / (max - min);
    const lowestColor = 255;
    const highestColor = 180;
    const value = Math.round(lowestColor + (highestColor - lowestColor) * percentage);
    return `rgb(255, ${value}, ${value})`;
}

function StatsTable({fiches, tochten, stats, checkpointLogs, teams}) {
    const nbFichesPerTocht = tochten.ids.map(id => ({
        id,
        nbFiches: Object.values(fiches.entities).filter((fiche) => fiche.tocht === id).length
    }));
    const ficheTimes = fiches.ids.flatMap(id => [stats.fiches[id].R.average, stats.fiches[id].B.average]);
    const minFicheTime = Math.min(...ficheTimes);
    const maxFicheTime = Math.max(...ficheTimes);
    return (
        <TableContainer component={Paper}>
            <Table stickyHeader size="small">
                <TableHead>
                    <TableRow>
                        <TableCell/>
                        {nbFichesPerTocht.map(({id, nbFiches}) => (
                            <TableCell colSpan={nbFiches} key={id} sx={{ pl: 1, pr: 1 }}>
                                {tochten.entities[id].identifier}
                            </TableCell>
                        ))}
                    </TableRow>
                    <TableRow>
                        <TableCell/>
                        {fiches.ids.map(id => (
                            <TableCell key={id} sx={{ pl: 1, pr: 1 }}>
                                {ficheDisplay(id, fiches, tochten)}&#8209;{ficheDisplay(getNextFiche(id, fiches), fiches, tochten)}
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    <TableRow>
                        <TableCell/>
                        {fiches.ids.map(id => (
                            <TableCell style={{ color: 'red', backgroundColor: ficheTimeToColor(stats.fiches[id].R.average, minFicheTime, maxFicheTime) }} key={id} sx={{ pl: 1, pr: 1 }}>
                                {Math.round(stats.fiches[id].R.average / 60)}m
                            </TableCell>
                        ))}
                    </TableRow>
                    <TableRow>
                        <TableCell/>
                        {fiches.ids.map(id => (
                            <TableCell style={{ color: 'blue', backgroundColor: ficheTimeToColor(stats.fiches[id].B.average, minFicheTime, maxFicheTime) }} key={id} sx={{ pl: 1, pr: 1 }}>
                                {Math.round(stats.fiches[id].B.average / 60)}m
                            </TableCell>
                        ))}
                    </TableRow>
                    {teams.ids.map(id => (
                        <TableRow key={id}>
                            <TableCell sx={{ pl: 1, pr: 1 }} style={{ color: teams.entities[id].direction === 'R' ? 'red' : 'blue'}}>
                                G{teams.entities[id].number.toString().padStart(2, '0')}
                            </TableCell>
                            {fiches.ids.map(ficheId => (
                                <TableCell key={ficheId}>
                                    {toHoursMinutes(getCheckpointLog(id, ficheId, checkpointLogs)?.arrived)}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    )
}

export default memo(function TracingPage() {
    const navigate = useNavigate();

    const {data: fiches} = useGetFichesQuery();
    const {data: tochten} = useGetTochtenQuery();
    const {data: stats} = useGetStatsQuery();
    const {data: checkpointLogs} = useGetCheckpointLogsQuery();
    const {data: teams} = useGetTeamsQuery();

    return (
        <>
            <AppBar position="sticky" color="inherit">
                <Toolbar>
                    <IconButton sx={{mr: 2}} onClick={() => navigate(-1)} color="inherit">
                        <ArrowBackIcon/>
                    </IconButton>
                    <Typography variant="h6">Tracing</Typography>
                </Toolbar>
            </AppBar>
            <Container sx={{pt: 2}}>
                <Stack spacing={2}>
                    {tochten && stats && (
                        <Box>
                            <h2>Tochten</h2>
                            <TochtenTable stats={stats} tochten={tochten}/>
                        </Box>
                    )}
                    {fiches && tochten && stats && checkpointLogs && teams && (
                        <Box>
                            <h2>Fiches</h2>
                            <StatsTable stats={stats} fiches={fiches} tochten={tochten} checkpointLogs={checkpointLogs} teams={teams}/>
                        </Box>
                    )}
                </Stack>
            </Container>
        </>
    )
})