import { useCallback } from 'react';
import { LngLat } from 'react-map-gl/maplibre';

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';

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

  const onAccept = useCallback(() => {
    if (!position || !selectedTracker) {
      return;
    }
    onComplete();
    const { lng, lat } = position;
    createTrackerLog({
      point: {
        type: 'Point' as const,
        coordinates: [lng, lat],
      },
      tracker: selectedTracker.id,
    });
  }, [createTrackerLog, position, onComplete, selectedTracker]);

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
