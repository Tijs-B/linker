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

import type { Fiche, Stats, Tocht } from '../../services/types.ts';
import { secondsToHoursMinutes } from '../../utils/time.ts';

interface TochtenTableProps {
  tochten: EntityState<Tocht, number>;
  fiches: EntityState<Fiche, number>;
  stats: Stats;
  showFull: boolean;
}

export default function TochtenTable({ tochten, fiches, stats, showFull }: TochtenTableProps) {
  const rows = useMemo(() => {
    const theStats = showFull ? stats.fullTochten : stats.partialTochten;
    const filteredIds = tochten.ids.filter((id) => !tochten.entities[id].is_alternative);
    return filteredIds.map((tochtId) => {
      const tocht = tochten.entities[tochtId];
      const nextTocht = filteredIds[(filteredIds.indexOf(tochtId) + 1) % filteredIds.length];

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
          <TableCell>
            {secondsToHoursMinutes(theStats[tochtId].R.average, false)} (
            {theStats[tochtId].R.nb_teams} groepen)
          </TableCell>
          <TableCell>
            {tocht.identifier} Blauw ({end}&rarr;{start})
          </TableCell>
          <TableCell>
            {secondsToHoursMinutes(theStats[tochtId].B.average, false)} (
            {theStats[tochtId].B.nb_teams} groepen)
          </TableCell>
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
}
