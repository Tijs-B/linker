import { useMemo } from 'react';

import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';

import type { EntityState } from '@reduxjs/toolkit';

import type { CheckpointLog, Fiche, Stats, Team, Tocht } from '../../services/types.ts';
import { toHoursMinutes } from '../../utils/time.ts';
import PersonAvatar from '../PersonAvatar.jsx';

function ficheTimeToColor(time: number, min: number, max: number): string {
  const percentage = (time - min) / (max - min);
  const lowestColor = 255;
  const highestColor = 180;
  const value = Math.round(lowestColor + (highestColor - lowestColor) * percentage);
  return `rgb(255, ${value}, ${value})`;
}

function getCheckpointLog(team: number, fiche: number, checkpointLogs: CheckpointLog[]) {
  for (const log of checkpointLogs) {
    if (log.fiche === fiche && log.team === team) {
      return log;
    }
  }
  return null;
}

interface StatsTableProps {
  fiches: EntityState<Fiche, number>;
  tochten: EntityState<Tocht, number>;
  stats: Stats;
  checkpointLogs: EntityState<CheckpointLog, number>;
  teams: EntityState<Team, number>;
}

export default function StatsTable({
  fiches,
  tochten,
  stats,
  checkpointLogs,
  teams,
}: StatsTableProps) {
  const nbFichesPerTocht = useMemo(() => {
    return tochten.ids
      .filter((id) => !tochten.entities[id].is_alternative)
      .map((id) => ({
        id,
        nbFiches: Object.values(fiches.entities).filter((fiche) => fiche.tocht === id).length,
      }));
  }, [fiches, tochten]);

  const [minFicheTime, maxFicheTime] = useMemo(() => {
    const ficheTimes = fiches.ids.flatMap((id) => {
      if ('id' in stats.fiches) {
        return [stats.fiches[id].R.average, stats.fiches[id].B.average];
      }
      return [];
    });
    const minFicheTime = Math.min(...ficheTimes);
    const maxFicheTime = Math.max(...ficheTimes);
    return [minFicheTime, maxFicheTime];
  }, [fiches, stats]);

  const sortedCheckpoints = useMemo(() => {
    return Object.values(checkpointLogs.entities).sort(
      (a, b) => new Date(a.arrived).valueOf() - new Date(b.arrived).valueOf(),
    );
  }, [checkpointLogs]);

  const filteredIds = fiches.ids.filter((i) => i in stats.fiches);
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
            {filteredIds.map((id) => (
              <TableCell key={id} sx={{ pl: 1, pr: 1 }}>
                {fiches.entities[id].display_name}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell />
            {filteredIds.map((id) => (
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
                {Math.round(stats.fiches[id].R.average / 60)} min
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell />
            {filteredIds.map((id) => (
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
                {Math.round(stats.fiches[id].B.average / 60)} min
              </TableCell>
            ))}
          </TableRow>
          {teams.ids.map((id) => (
            <TableRow key={id}>
              <TableCell sx={{ pl: 1, pr: 1 }}>
                <PersonAvatar item={teams.entities[id]} sx={{ width: 30, height: 30 }} />
              </TableCell>
              {fiches.ids.map((ficheId) => (
                <TableCell key={ficheId}>
                  {toHoursMinutes(getCheckpointLog(id, ficheId, sortedCheckpoints)?.arrived)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
