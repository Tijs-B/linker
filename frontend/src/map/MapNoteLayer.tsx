import { memo, useEffect, useMemo } from 'react';
import { Layer, MapLayerMouseEvent, Source, useMap } from 'react-map-gl/maplibre';

import { yellow } from '@mui/material/colors';

import { MapStyleImageMissingEvent } from 'maplibre-gl';

import { useGetMapNotesQuery } from '../services/linker.ts';
import { generateMapNoteIcon } from '../utils/icons.ts';

const MapNoteLayer = memo(function MapNoteLayer({ visible }: { visible: boolean }) {
  const { mainMap } = useMap();

  const { data: mapNotes } = useGetMapNotesQuery();

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

    const onImageMissing = function (e: MapStyleImageMissingEvent) {
      if (e.id === 'map-note') {
        const icon = generateMapNoteIcon(yellow[400]);
        if (icon) {
          mainMap.addImage(e.id, icon);
        }
      }
    };

    const onMouseEnter = function () {
      mainMap.getCanvas().style.cursor = 'pointer';
    };

    const onMouseLeave = function () {
      mainMap.getCanvas().style.cursor = '';
    };

    const onClick = (e: MapLayerMouseEvent) => {
      if (e.features) {
        const feature = e.features[0];
        console.log(feature);
      }
    };

    mainMap.on('mouseenter', 'map-notes', onMouseEnter);
    mainMap.on('mouseleave', 'map-notes', onMouseLeave);
    mainMap.on('click', 'map-notes', onClick);
    mainMap.on('styleimagemissing', onImageMissing);

    return () => {
      mainMap.off('mouseenter', 'map-notes', onMouseEnter);
      mainMap.off('mouseleave', 'map-notes', onMouseLeave);
      mainMap.off('click', 'map-notes', onClick);
      mainMap.off('styleimagemissing', onImageMissing);
    };
  }, [mainMap]);

  return (
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
  );
});

export default MapNoteLayer;
