import { Link as RouterLink } from 'react-router-dom';

import {
  Link,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { green, red } from '@mui/material/colors';

import { EntityState } from '@reduxjs/toolkit';

import { Fiche, Stats, Team, Tocht, Tracker, Weide } from '../../services/types.ts';
import { getPositionDescription } from '../../utils/data.ts';
import { secondsToHoursMinutes } from '../../utils/time.ts';
import PersonAvatar from '../PersonAvatar.jsx';

function discreteValue(value: number, possibilities: number[]): number {
  return possibilities.reduce((prev, curr) =>
    Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev,
  );
}

function getColorProps(value: number, maxValue: number): { bgcolor: string; color: string } {
  const percentage = Math.min(1, Math.abs(value) / maxValue);
  const shade = discreteValue(900 * percentage, [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]);
  // @ts-expect-error Value of `shade` is always a valid index for `red` and `green`
  const bgcolor = value > 0 ? red[shade] : green[shade];
  const color = shade >= 500 ? '#ffffff' : '#000000';
  return { bgcolor, color };
}

interface TeamRowProps {
  id: number;
  teams: EntityState<Team, number>;
  fiches: EntityState<Fiche, number>;
  tochten: EntityState<Tocht, number>;
  weides: EntityState<Weide, number>;
  stats: Stats;
  trackers: EntityState<Tracker, number>;
  showFull: boolean;
}

const TeamRow = function ({
  id,
  teams,
  fiches,
  tochten,
  weides,
  stats,
  trackers,
  showFull,
}: TeamRowProps) {
  const team = teams.entities[id];
  const tracker = team.tracker === null ? null : trackers.entities[team.tracker];
  const description = tracker && getPositionDescription(tracker, fiches, tochten, weides);
  const teamStats = stats.teams[id];
  const tochtDev = showFull ? teamStats.avgFullTochtDeviation : teamStats.avgPartialTochtDeviation;
  const ficheDev = teamStats.avgFicheDeviation;
  const tochtDevColor = tochtDev !== null ? getColorProps(tochtDev, 1.5 * 60 * 60) : {};
  const ficheDevColor = ficheDev !== null ? getColorProps(ficheDev, 15 * 60) : {};
  return (
    <TableRow>
      <TableCell>
        <Stack direction="row" spacing={1}>
          <PersonAvatar item={teams.entities[id]} sx={{ width: 30, height: 30 }} />
          <Link variant="body1" color="inherit" component={RouterLink} to={`/team/${id}/`}>
            {team.name}
          </Link>
        </Stack>
      </TableCell>
      <TableCell sx={tochtDevColor}>{secondsToHoursMinutes(tochtDev)}</TableCell>
      <TableCell sx={ficheDevColor}>{secondsToHoursMinutes(ficheDev)}</TableCell>
      <TableCell>{description}</TableCell>
      <TableCell></TableCell>
    </TableRow>
  );
};

interface TeamsTableProps {
  teams: EntityState<Team, number>;
  fiches: EntityState<Fiche, number>;
  tochten: EntityState<Tocht, number>;
  weides: EntityState<Weide, number>;
  stats: Stats;
  trackers: EntityState<Tracker, number>;
  showFull: boolean;
}

export default function TeamTable({
  teams,
  fiches,
  tochten,
  weides,
  stats,
  trackers,
  showFull,
}: TeamsTableProps) {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell />
            <TableCell>Gem. afwijking voor tochten</TableCell>
            <TableCell>Gem. afwijking voor fiches</TableCell>
            <TableCell>Locatie</TableCell>
            <TableCell>Veilig op weide</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {teams.ids.map((id) => (
            <TeamRow
              key={id}
              id={id}
              teams={teams}
              stats={stats}
              tochten={tochten}
              fiches={fiches}
              trackers={trackers}
              weides={weides}
              showFull={showFull}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
