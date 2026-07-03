import type { SubmitEvent } from 'react';
import { useCallback } from 'react';

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
} from '@mui/material';

import centroid from '@turf/centroid';
import dayjs from 'dayjs';
import type { Point } from 'geojson';

import { useCreatePositionMutation } from '../services/linker.ts';
import type { Team, Weide } from '../services/types.ts';

interface AddManualPositionDialogProps {
  team: Team;
  weide: Weide | null;
  onComplete: () => void;
}

export default function AddManualPositionDialog({
  team,
  weide,
  onComplete,
}: AddManualPositionDialogProps) {
  const createPosition = useCreatePositionMutation()[0];

  const onAccept = useCallback(
    (event: SubmitEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (!weide) {
        return;
      }
      createPosition({
        point: centroid(weide.polygon).geometry as Point,
        timestamp: dayjs().tz('Europe/Brussels').toISOString(),
        team: team.id,
        organization_member: null,
      });
      onComplete();
    },
    [weide, team, createPosition, onComplete],
  );

  return (
    <Dialog
      open={weide !== null}
      onClose={onComplete}
      maxWidth="xs"
      disableRestoreFocus
      slotProps={{ paper: { component: 'form', onSubmit: onAccept } }}
    >
      <DialogTitle>Manuele positie toevoegen</DialogTitle>
      <DialogContent>
        <DialogContentText>
          <Typography gutterBottom>
            Er is geen recente locatie gekend voor G{team.code} in de buurt van weide {weide?.name}.
          </Typography>
          <Typography gutterBottom>
            G{team.code} verplaatsen naar weide {weide?.name}?
          </Typography>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onComplete}>Annuleren</Button>
        <Button type="submit" variant="contained" autoFocus>
          Toevoegen
        </Button>
      </DialogActions>
    </Dialog>
  );
}
