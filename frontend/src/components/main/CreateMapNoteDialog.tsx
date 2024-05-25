import { ChangeEvent, useCallback, useState } from 'react';
import { LngLat } from 'react-map-gl/maplibre';

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from '@mui/material';

import { useCreateMapNoteMutation } from '../../services/linker.ts';

interface CreateMapNoteDialogProps {
  location: LngLat | null;
  onComplete: () => void;
}

export default function CreateMapNoteDialog({ location, onComplete }: CreateMapNoteDialogProps) {
  const createMapNote = useCreateMapNoteMutation()[0];

  const [description, setDescription] = useState('');

  const onMapNoteDescriptionChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setDescription(event.target.value),
    [],
  );
  const onCreateMapNote = useCallback(() => {
    if (!location) {
      return;
    }
    const { lng, lat } = location;
    const data = {
      content: description,
      point: {
        type: 'Point' as const,
        coordinates: [lng, lat],
      },
    };

    createMapNote(data);
    onComplete();
  }, [createMapNote, description, location, onComplete]);

  return (
    <Dialog open={location !== null} onClose={onComplete}>
      <DialogTitle>Nieuwe kaartnotitie</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Je staat op het punt een nieuwe kaartnotitie te maken. Geef een korte beschrijving.
        </DialogContentText>
        <TextField
          value={description}
          onChange={onMapNoteDescriptionChange}
          label="Beschrijving"
          variant="standard"
          fullWidth
          margin="dense"
          autoFocus
          required
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onCreateMapNote} variant="contained">
          Toevoegen
        </Button>
      </DialogActions>
    </Dialog>
  );
}
