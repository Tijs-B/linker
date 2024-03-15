import { ChangeEvent, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Layer, MapLayerMouseEvent, Source, useMap } from 'react-map-gl/maplibre';

import DeleteIcon from '@mui/icons-material/Delete';
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

import {
  useDeleteMapNoteMutation,
  useGetMapNotesQuery,
  useUpdateMapNoteMutation,
} from '../services/linker.ts';
import { MapNote } from '../services/types.ts';

type HoverInfo = MapNote & {
  x: number;
  y: number;
};

const MapNoteLayer = memo(function MapNoteLayer({ visible }: { visible: boolean }) {
  const { mainMap } = useMap();
  const [selectedNote, setSelectedNote] = useState<MapNote | null>(null);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);

  const { data: mapNotes } = useGetMapNotesQuery();
  const deleteMapNote = useDeleteMapNoteMutation()[0];
  const updateMapNote = useUpdateMapNoteMutation()[0];

  const geojsonData = useMemo(
    () => ({
      type: 'FeatureCollection',
      features: mapNotes
        ? Object.values(mapNotes.entities).map((mapNote) => ({
            type: 'Feature',
            id: mapNote.id,
            geometry: mapNote.point,
          }))
        : [],
    }),
    [mapNotes],
  );

  useEffect(() => {
    if (!mainMap) {
      return;
    }

    const onClick = (e: MapLayerMouseEvent) => {
      if (e.features) {
        const feature = e.features[0];
        const id = feature.id;
        if (id && mapNotes) {
          setSelectedNote(mapNotes.entities[Number(id)]);
        }
      }
    };

    const onMove = (e: MapLayerMouseEvent) => {
      const {
        features,
        point: { x, y },
      } = e;
      const id = features && features[0] && features[0].id;
      const note = mapNotes?.entities[Number(id)];
      if (note) {
        setHoverInfo({
          x,
          y,
          ...note,
        });
      } else {
        setHoverInfo(null);
      }
    };

    const onLeave = () => {
      setHoverInfo(null);
    };

    mainMap.on('click', 'map-notes', onClick);
    mainMap.on('mousemove', 'map-notes', onMove);
    mainMap.on('mouseleave', 'map-notes', onLeave);

    return () => {
      mainMap.off('click', 'map-notes', onClick);
      mainMap.off('mousemove', 'map-notes', onMove);
      mainMap.off('mouseleave', 'map-notes', onLeave);
    };
  }, [mainMap, mapNotes]);

  const onDialogClose = useCallback(() => {
    setSelectedNote(null);
  }, []);

  const onUpdateMapNote = useCallback(() => {
    if (selectedNote) {
      const data = {
        id: selectedNote.id,
        content: selectedNote.content,
      };
      updateMapNote(data);
      setSelectedNote(null);
    }
  }, [selectedNote, updateMapNote]);

  const onDeleteMapNote = useCallback(() => {
    if (selectedNote) {
      deleteMapNote(selectedNote.id);
      setSelectedNote(null);
    }
  }, [selectedNote, deleteMapNote]);

  const onMapNoteDescriptionChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setSelectedNote((note) => note && { ...note, content: e.target.value });
  }, []);

  console.log(hoverInfo?.x);

  return (
    <>
      <Source type="geojson" data={geojsonData}>
        <Layer
          type="symbol"
          id="map-notes"
          layout={{
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
            'icon-image': 'map-note',
            'icon-offset': [11, -16.5 * 2],
            'icon-size': 0.5,
            visibility: visible ? 'visible' : 'none',
          }}
        />
      </Source>
      <Dialog open={!!selectedNote} onClose={onDialogClose} fullWidth>
        <DialogTitle>Kaartnotitie</DialogTitle>
        <DialogContent>
          <TextField
            value={selectedNote?.content}
            onChange={onMapNoteDescriptionChange}
            label="Beschrijving"
            variant="standard"
            fullWidth
            margin="dense"
            autoFocus
            multiline
            inputProps={{ spellCheck: 'false' }}
          />
          <DialogContentText>
            Toegevoegd: {dayjs(selectedNote?.created).fromNow()}
            <br />
            Aangepast: {dayjs(selectedNote?.created).fromNow()}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={onDeleteMapNote}
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
          >
            Verwijder
          </Button>
          <Button onClick={onUpdateMapNote} variant="contained">
            Update
          </Button>
        </DialogActions>
      </Dialog>
      {hoverInfo && (
        <div className="tooltip" style={{ left: hoverInfo.x, top: hoverInfo.y }}>
          {hoverInfo.content}
        </div>
      )}
    </>
  );
});

export default MapNoteLayer;
