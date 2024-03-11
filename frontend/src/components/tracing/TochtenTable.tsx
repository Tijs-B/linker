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

import { Stats, Tocht } from '../../services/types.ts';
import { secondsToHoursMinutes } from '../../utils/time.ts';

interface TochtenTableProps {
  tochten: EntityState<Tocht, number>;
  stats: Stats;
}

const TochtenTable = memo(function TochtenTable({ tochten, stats }: TochtenTableProps) {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell />
            <TableCell>Rood</TableCell>
            <TableCell>Blauw</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tochten.ids.map((id) => (
            <TableRow key={id}>
              <TableCell>{tochten.entities[id].identifier}</TableCell>
              <TableCell>{secondsToHoursMinutes(stats.tochten[id].R.average)}</TableCell>
              <TableCell>{secondsToHoursMinutes(stats.tochten[id].B.average)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
});

export default TochtenTable;
