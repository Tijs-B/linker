import { useCallback, useState } from 'react';
import { LngLat } from 'react-map-gl/maplibre';

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { TimePicker } from '@mui/x-date-pickers';

import dayjs, { Dayjs } from 'dayjs';

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
  const [dateTime, setDateTime] = useState<Dayjs | null>(dayjs().tz('Europe/Brussels'));
  const [prevPosition, setPrevPosition] = useState(position);

  if (position !== prevPosition) {
    setPrevPosition(position);
    setDateTime(dayjs().tz('Europe/Brussels'));
  }

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
  }, [position, selectedTracker, onComplete, dateTime, createTrackerLog]);

  if (selectedTracker === null || selectedItem === null) {
    return null;
  }

  return (
    <Dialog open={position !== null} onClose={onComplete} maxWidth="xs">
      <DialogTitle>Manuele tracker-update</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Je staat op het punt tracker <code>{selectedTracker.tracker_name}</code>, gebruikt door{' '}
          {selectedItem.name}, te verplaatsen.
        </DialogContentText>
        <TimePicker
          timezone="Europe/Brussels"
          label="Tijdstip op dit punt"
          sx={{ mt: 2 }}
          value={dateTime}
          onChange={setDateTime}
        />
      </DialogContent>
      <DialogActions>
        <Button color="error" onClick={onComplete}>
          Annuleren
        </Button>
        <Button variant="contained" color="success" onClick={onAccept}>
          Verplaatsen
        </Button>
      </DialogActions>
    </Dialog>
  );
}
