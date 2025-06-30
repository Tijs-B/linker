import CancelIcon from '@mui/icons-material/Cancel';
import CheckIcon from '@mui/icons-material/Check';
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

import type { OrganizationMember, Team, Tracker } from '../../services/types.ts';

interface TrackersTableProps {
  trackers: EntityState<Tracker, number>;
  teams: EntityState<Team, number>;
  members: EntityState<OrganizationMember, number>;
}

export default function TrackersTable({ trackers, teams, members }: TrackersTableProps) {
  const coupledMapping: { [key: number]: string } = {};

  Object.values(teams.entities).forEach((team) => {
    if (team.tracker) {
      coupledMapping[team.tracker] = `${team.direction}${team.code} ${team.name}`;
    }
  });

  Object.values(members.entities).forEach((member) => {
    if (member.tracker) {
      coupledMapping[member.tracker] = `${member.code} ${member.name}`;
    }
  });

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Code</TableCell>
            <TableCell>Online</TableCell>
            <TableCell>Gekoppeld aan</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {trackers.ids.map((trackerId) => {
            const tracker = trackers.entities[trackerId];
            return (
              <TableRow>
                <TableCell>{tracker.tracker_name}</TableCell>
                <TableCell>
                  {tracker.is_online ? (
                    <CheckIcon color="success" fontSize="small" />
                  ) : (
                    <CancelIcon color="warning" fontSize="small" />
                  )}
                </TableCell>
                <TableCell>
                  {tracker.id in coupledMapping ? coupledMapping[tracker.id] : '-'}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
