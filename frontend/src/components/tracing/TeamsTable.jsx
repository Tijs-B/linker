import {memo} from "react";
import {
    Link,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from "@mui/material";
import PersonAvatar from "../PersonAvatar.jsx";
import {getPositionDescription} from "../../utils/data.js";
import {secondsToHoursMinutes} from "../../utils/time.js";
import {green, red} from "@mui/material/colors";
import {Link as RouterLink} from "react-router-dom";

function discreteValue(value, possibilities) {
    return possibilities.reduce((prev, curr) => Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev);
}

function getColorProps(value, maxValue) {
    const percentage = Math.min(1, Math.abs(value) / maxValue);
    const shade = discreteValue(900 * percentage, [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]);
    const bgcolor = value > 0 ? red[shade] : green[shade];
    const color = shade >= 500 ? '#ffffff' : '#000000';
    return {bgcolor, color}
}

const TeamRow = function({id, teams, fiches, tochten, weides, basis, stats, trackers}) {

    const team = teams.entities[id];
    const tracker = trackers.entities[team.tracker];
    const description = getPositionDescription(tracker.last_log.point, fiches, tochten, weides, basis);
    const teamStats = stats.teams[id];
    const tochtDev = teamStats.avgTochtDeviation;
    const ficheDev = teamStats.avgFicheDeviation;
    return (
        <TableRow>
            <TableCell>
                <Stack direction="row" spacing={1}>
                    <PersonAvatar item={teams.entities[id]} sx={{width: 30, height: 30}}/>
                    <Link variant="body1" color="inherit" component={RouterLink} to={`/team/${id}/`}>{team.name}</Link>
                </Stack>
            </TableCell>
            <TableCell sx={getColorProps(tochtDev, 1.5 * 60 * 60)}>
                {secondsToHoursMinutes(tochtDev)}
            </TableCell>
            <TableCell sx={getColorProps(ficheDev, 15 * 60)}>
                {secondsToHoursMinutes(ficheDev)}
            </TableCell>
            <TableCell>
                {description}
            </TableCell>
            <TableCell>

            </TableCell>
        </TableRow>
    )
}

const TeamsTable = memo(function TeamTable({ teams, fiches, tochten, weides, basis, stats, trackers }) {
    return (
        <TableContainer>
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell/>
                        <TableCell>Gem. afwijking voor tochten</TableCell>
                        <TableCell>Gem. afwijking voor fiches</TableCell>
                        <TableCell>Locatie</TableCell>
                        <TableCell>Veilig op weide</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {teams.ids.map(id => (
                        <TeamRow key={id} id={id} teams={teams} stats={stats} basis={basis} tochten={tochten} fiches={fiches} trackers={trackers} weides={weides}/>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    )
})

export default TeamsTable;
