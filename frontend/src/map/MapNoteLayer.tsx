import { memo, useEffect, useMemo } from 'react';
import { Layer, MapLayerMouseEvent, Source, useMap } from 'react-map-gl/maplibre';

import { useGetMapNotesQuery } from '../services/linker.ts';

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

    const onClick = (e: MapLayerMouseEvent) => {
      if (e.features) {
        const feature = e.features[0];
        console.log(feature);
      }
    };

    mainMap.on('click', 'map-notes', onClick);

    return () => {
      mainMap.off('click', 'map-notes', onClick);
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
