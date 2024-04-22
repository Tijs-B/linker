import { memo, useMemo } from 'react';

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

import { Fiche, Stats, Tocht } from '../../services/types.ts';
import { secondsToHoursMinutes } from '../../utils/time.ts';

interface TochtenTableProps {
  tochten: EntityState<Tocht, number>;
  fiches: EntityState<Fiche, number>;
  stats: Stats;
  showFull: boolean;
}

const TochtenTable = memo(function TochtenTable({
  tochten,
  fiches,
  stats,
  showFull,
}: TochtenTableProps) {
  const rows = useMemo(() => {
    const theStats = showFull ? stats.fullTochten : stats.partialTochten;
    return tochten.ids.map((tochtId) => {
      const tocht = tochten.entities[tochtId];
      const nextTocht = tochten.ids[(tochten.ids.indexOf(tochtId) + 1) % tochten.ids.length];

      const nextFiche = Object.values(fiches.entities).find(
        (fiche) => fiche.tocht === nextTocht && fiche.order === 1,
      )!;
      const allFiches = fiches.ids
        .map((ficheId) => fiches.entities[ficheId])
        .filter((fiche) => fiche.tocht === tochtId)
        .map((fiche) => fiche.display_name);

      const start = showFull ? allFiches[0] : allFiches[1];
      const end = showFull ? nextFiche.display_name : allFiches[allFiches.length - 1];

      return (
        <TableRow key={tochtId}>
          <TableCell>
            {tocht.identifier} Rood ({start}&rarr;{end})
          </TableCell>
          <TableCell>{secondsToHoursMinutes(theStats[tochtId].R.average)}</TableCell>
          <TableCell>
            {tocht.identifier} Blauw ({end}&rarr;{start})
          </TableCell>
          <TableCell>{secondsToHoursMinutes(theStats[tochtId].B.average)}</TableCell>
        </TableRow>
      );
    });
  }, [tochten, fiches, stats, showFull]);

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell />
            <TableCell>Gemiddelde</TableCell>
            <TableCell />
            <TableCell>Gemiddelde</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>{rows}</TableBody>
      </Table>
    </TableContainer>
  );
});

export default TochtenTable;
