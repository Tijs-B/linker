import { memo, useMemo } from 'react';
import { Layer, Source } from 'react-map-gl/maplibre';

import { grey, red } from '@mui/material/colors';

import { feature, featureCollection } from '@turf/helpers';

import {
  useGetFichesQuery,
  useGetForbiddenAreasQuery,
  useGetTochtenQuery,
  useGetZijwegenQuery,
} from '../services/linker.ts';

interface BackgroundLayersProps {
  showHeatmap: boolean;
}

function BackgroundLayers({ showHeatmap }: BackgroundLayersProps) {
  const { data: tochten } = useGetTochtenQuery();
  const { data: fiches } = useGetFichesQuery();
  const { data: zijwegen } = useGetZijwegenQuery();
  const { data: forbiddenAreas } = useGetForbiddenAreasQuery();

  const tochtenData = useMemo(() => {
    if (!tochten) {
      return featureCollection([]);
    }
    return featureCollection(
      Object.values(tochten.entities).map((tocht) => feature(tocht.route, {}, { id: tocht.id })),
    );
  }, [tochten]);

  const fichesData = useMemo(() => {
    if (!fiches) {
      return featureCollection([]);
    }
    return featureCollection(
      Object.values(fiches.entities).map((fiche) =>
        feature(
          fiche.point,
          { name: fiche.display_name },
          { id: fiche.id },
        ),
      ),
    );
  }, [fiches]);

  const zijwegenData = useMemo(() => {
    if (!zijwegen) {
      return featureCollection([]);
    }
    return featureCollection(
      Object.values(zijwegen.entities).map((zijweg) => feature(zijweg.geom, {}, { id: zijweg.id })),
    );
  }, [zijwegen]);

  const forbiddenAreasData = useMemo(() => {
    if (!forbiddenAreas) {
      return featureCollection([]);
    }
    return featureCollection(
      forbiddenAreas.map((area) =>
        feature(area.area, { description: area.description }, { id: area.id }),
      ),
    );
  }, [forbiddenAreas]);

  return (
    <>
      <Source
        type="raster"
        scheme="xyz"
        minzoom={9}
        maxzoom={16}
        tileSize={256}
        tiles={['/api/heatmap/{z}/{x}/{y}.png']}
      >
        <Layer
          id="heatmap"
          type="raster"
          layout={{ visibility: showHeatmap ? 'visible' : 'none' }}
        />
      </Source>

      <Source type="geojson" data={fichesData}>
        <Layer
          id="fiches"
          type="symbol"
          layout={{
            'icon-allow-overlap': true,
            'text-field': ['get', 'name'],
            'text-size': 10,
            'text-font': ['D-DIN DIN-Bold', 'Arial Unicode MS Regular'],
            'text-max-width': 5,
            visibility: showHeatmap ? 'none' : 'visible',
          }}
          paint={{
            'text-opacity': showHeatmap ? 0 : 1,
            'text-color': grey[800],
          }}
          minzoom={13}
        />
        <Layer
          id="fiches-circles"
          beforeId="fiches"
          type="circle"
          paint={{
            'circle-color': '#fff',
            'circle-radius': 10,
            'circle-stroke-color': grey[800],
            'circle-stroke-width': 1.5,
          }}
          layout={{ visibility: showHeatmap ? 'none' : 'visible' }}
          minzoom={13}
        />
      </Source>
      <Source type="geojson" data={tochtenData}>
        <Layer
          id="tochten"
          beforeId="fiches-circles"
          type="line"
          paint={{
            'line-width': 3,
            'line-color': grey[800],
          }}
          layout={{ visibility: showHeatmap ? 'none' : 'visible' }}
        />
        <Layer
          id="tochten-outline"
          beforeId="tochten"
          type="line"
          paint={{
            'line-width': 5,
            'line-color': '#fff',
          }}
          layout={{ visibility: showHeatmap ? 'none' : 'visible' }}
        />
      </Source>
      <Source type="geojson" data={zijwegenData}>
        <Layer
          id="zijwegen"
          beforeId="tochten"
          type="line"
          paint={{
            'line-width': 3,
            'line-color': grey[800],
          }}
          layout={{ visibility: showHeatmap ? 'none' : 'visible' }}
        />
        <Layer
          id="zijwegen-outline"
          beforeId="tochten-outline"
          type="line"
          paint={{
            'line-width': 5,
            'line-color': '#fff',
          }}
          layout={{ visibility: showHeatmap ? 'none' : 'visible' }}
        />
      </Source>
      <Source type="geojson" data={forbiddenAreasData}>
        <Layer
          id="forbidden-areas"
          type="fill"
          beforeId="zijwegen-outline"
          paint={{
            'fill-color': red[500],
            'fill-opacity': 0.5,
            'fill-outline-color': red[800],
          }}
          layout={{ visibility: showHeatmap ? 'none' : 'visible' }}
        />
      </Source>
    </>
  );
}

export default memo(BackgroundLayers);
