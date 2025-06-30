import { useCallback, useState } from 'react';
import type { LngLat } from 'react-map-gl/maplibre';

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from '@mui/material';

import dayjs from 'dayjs';

import { useCreateTrackerLogMutation } from '../../services/linker.ts';
import { selectSelectedItem, selectSelectedTracker, useAppSelector } from '../../store';

interface CreateTrackerLogDialogProps {
  position: LngLat | null;
  onComplete: () => void;
}

export default function CreateTrackerLogDialog({
  position,
  onComplete,
}: CreateTrackerLogDialogProps) {
  const selectedTracker = useAppSelector(selectSelectedTracker);
  const selectedItem = useAppSelector(selectSelectedItem);
  const createTrackerLog = useCreateTrackerLogMutation()[0];
  const [inputTime, setInputTime] = useState<string>(dayjs().tz('Europe/Brussels').format('HH:mm'));
  const [prevPosition, setPrevPosition] = useState(position);

  if (position !== prevPosition) {
    setPrevPosition(position);
    setInputTime(dayjs().tz('Europe/Brussels').format('HH:mm'));
  }

  const match = inputTime.match(/(\d{2}):(\d{2})/);
  const dateTime = match
    ? dayjs().tz('Europe/Brussels').hour(parseInt(match[1])).minute(parseInt(match[2]))
    : null;
  const error =
    dateTime === null
      ? 'Geen geldig tijdstip'
      : dateTime.isAfter(dayjs())
        ? 'Tijdstip mag niet in de toekomst liggen'
        : null;

  const onAccept = useCallback(() => {
    if (!position || !selectedTracker) {
      return;
    }
    onComplete();
    const { lng, lat } = position;
    const timestamp = dateTime ? dateTime : dayjs().tz('Europe/Brussels');
    createTrackerLog({
      point: {
        type: 'Point' as const,
        coordinates: [lng, lat],
      },
      tracker: selectedTracker.id,
      gps_datetime: timestamp.toISOString(),
    });
  }, [position, selectedTracker, onComplete, createTrackerLog, dateTime]);

  if (selectedTracker === null || selectedItem === null) {
    return null;
  }

  return (
    <Dialog open={position !== null} onClose={onComplete} maxWidth="xs" disableRestoreFocus>
      <DialogTitle>Manuele tracker-update</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Je staat op het punt tracker <code>{selectedTracker.tracker_name}</code>, gebruikt door{' '}
          {selectedItem.name}, te verplaatsen.
        </DialogContentText>
        <TextField
          autoFocus
          label="Tijdstip op dit punt"
          sx={{ mt: 2, minWidth: 200 }}
          value={inputTime}
          onChange={(e) => setInputTime(e.target.value)}
          error={!!error}
          helperText={error}
          type="time"
          slotProps={{
            htmlInput: { max: dayjs().tz('Europe/Brussels').format('HH:mm') },
            inputLabel: { shrink: true },
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button color="error" onClick={onComplete}>
          Annuleren
        </Button>
        <Button variant="contained" color="success" onClick={onAccept} disabled={!!error}>
          Verplaatsen
        </Button>
      </DialogActions>
    </Dialog>
  );
}
