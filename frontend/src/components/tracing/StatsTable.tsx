import { memo } from 'react';

import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';

import { EntityState } from '@reduxjs/toolkit';

import { CheckpointLog, Fiche, Stats, Team, Tocht } from '../../services/types.ts';
import { getCheckpointLog, getNextFiche } from '../../utils/data.ts';
import { toHoursMinutes } from '../../utils/time.ts';
import PersonAvatar from '../PersonAvatar.jsx';

function ficheTimeToColor(time: number, min: number, max: number): string {
  const percentage = (time - min) / (max - min);
  const lowestColor = 255;
  const highestColor = 180;
  const value = Math.round(lowestColor + (highestColor - lowestColor) * percentage);
  return `rgb(255, ${value}, ${value})`;
}

interface StatsTableProps {
  fiches: EntityState<Fiche, number>;
  tochten: EntityState<Tocht, number>;
  stats: Stats;
  checkpointLogs: EntityState<CheckpointLog, number>;
  teams: EntityState<Team, number>;
}

const StatsTable = memo(function StatsTable({
  fiches,
  tochten,
  stats,
  checkpointLogs,
  teams,
}: StatsTableProps) {
  const nbFichesPerTocht = tochten.ids.map((id) => ({
    id,
    nbFiches: Object.values(fiches.entities).filter((fiche) => fiche.tocht === id).length,
  }));
  const ficheTimes = fiches.ids.flatMap((id) => [
    stats.fiches[id].R.average,
    stats.fiches[id].B.average,
  ]);
  const minFicheTime = Math.min(...ficheTimes);
  const maxFicheTime = Math.max(...ficheTimes);
  return (
    <TableContainer component={Paper}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            <TableCell />
            {nbFichesPerTocht.map(({ id, nbFiches }) => (
              <TableCell colSpan={nbFiches} key={id} sx={{ pl: 1, pr: 1 }}>
                {tochten.entities[id].identifier}
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell />
            {fiches.ids.map((id) => (
              <TableCell key={id} sx={{ pl: 1, pr: 1 }}>
                {fiches.entities[id].display_name}&#8209;
                {fiches.entities[getNextFiche(id, fiches)].display_name}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell />
            {fiches.ids.map((id) => (
              <TableCell
                style={{
                  color: 'red',
                  backgroundColor: ficheTimeToColor(
                    stats.fiches[id].R.average,
                    minFicheTime,
                    maxFicheTime,
                  ),
                }}
                key={id}
                sx={{ pl: 1, pr: 1 }}
              >
                {Math.round(stats.fiches[id].R.average / 60)}m
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell />
            {fiches.ids.map((id) => (
              <TableCell
                style={{
                  color: 'blue',
                  backgroundColor: ficheTimeToColor(
                    stats.fiches[id].B.average,
                    minFicheTime,
                    maxFicheTime,
                  ),
                }}
                key={id}
                sx={{ pl: 1, pr: 1 }}
              >
                {Math.round(stats.fiches[id].B.average / 60)}m
              </TableCell>
            ))}
          </TableRow>
          {teams.ids.map((id) => (
            <TableRow key={id}>
              <TableCell sx={{ pl: 1, pr: 1 }}>
                <PersonAvatar item={teams.entities[id]} width={30} />
              </TableCell>
              {fiches.ids.map((ficheId) => (
                <TableCell key={ficheId}>
                  {toHoursMinutes(getCheckpointLog(id, ficheId, checkpointLogs)?.arrived)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
});

export default StatsTable;
