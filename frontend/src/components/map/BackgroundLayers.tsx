import { useMemo } from 'react';
import { Layer, Source } from 'react-map-gl/maplibre';

import { green, grey, red } from '@mui/material/colors';

import centroid from '@turf/centroid';
import { feature, featureCollection } from '@turf/helpers';

import {
  useGetFichesQuery,
  useGetForbiddenAreasQuery,
  useGetTochtenQuery,
  useGetWeidesQuery,
  useGetZijwegenQuery,
} from '../../services/linker.ts';
import { contourUrl, demUrl } from '../../utils/dem.ts';

interface BackgroundLayersProps {
  showHeatmap: boolean;
  showSatellite: boolean;
  showZijwegen: boolean;
}

export default function BackgroundLayers({
  showHeatmap,
  showZijwegen,
  showSatellite,
}: BackgroundLayersProps) {
  const { data: tochten } = useGetTochtenQuery();
  const { data: fiches } = useGetFichesQuery();
  const { data: zijwegen } = useGetZijwegenQuery();
  const { data: forbiddenAreas } = useGetForbiddenAreasQuery();
  const { data: weides } = useGetWeidesQuery();

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
        feature(fiche.point, { name: fiche.display_name }, { id: fiche.id }),
      ),
    );
  }, [fiches]);

  const [weidesData, weidesLabelData] = useMemo(() => {
    if (!weides) {
      return [featureCollection([]), featureCollection([])];
    }
    const weidesData = featureCollection(
      Object.values(weides.entities).map((weide) => feature(weide.polygon, {}, { id: weide.id })),
    );
    const labelData = featureCollection(
      Object.values(weides.entities).map((weide) =>
        centroid(weide.polygon, { properties: { name: weide.identifier } }),
      ),
    );
    return [weidesData, labelData];
  }, [weides]);

  const tochtLinePaint = {
    'line-width': showSatellite ? 2 : 3,
    'line-color': showSatellite ? 'rgba(255,113,113,0.87)' : '#424242',
  };
  const tochtOutlinePaint = {
    'line-width': showSatellite ? 4 : 5,
    'line-color': showSatellite ? '#ffffff55' : '#fafafa',
  };

  return (
    <>
      <Source type="raster-dem" tiles={[demUrl]} tileSize={256} encoding="terrarium" maxzoom={14}>
        <Layer
          id="hillshade"
          type="hillshade"
          minzoom={3}
          paint={{
            'hillshade-accent-color': 'hsl(98, 35%, 86%)',
            'hillshade-exaggeration': [
              'interpolate',
              ['linear'],
              ['zoom'],
              6,
              0.4,
              14,
              0.35,
              18,
              0.25,
            ],
            'hillshade-shadow-color': 'rgba(43, 79, 28, 1)',
            'hillshade-highlight-color': 'rgba(200, 200, 126, 1)',
          }}
          layout={{ visibility: showHeatmap || showSatellite ? 'none' : 'visible' }}
        />
      </Source>
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
            'text-allow-overlap': true,
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
          paint={tochtLinePaint}
          layout={{ visibility: showHeatmap ? 'none' : 'visible' }}
        />
        <Layer
          id="tochten-outline"
          beforeId="tochten"
          type="line"
          paint={tochtOutlinePaint}
          layout={{ visibility: showHeatmap ? 'none' : 'visible' }}
        />
      </Source>
      <Source type="geojson" data={zijwegen || featureCollection([])}>
        <Layer
          id="zijwegen"
          beforeId="tochten"
          type="line"
          paint={tochtLinePaint}
          layout={{ visibility: showHeatmap || !showZijwegen ? 'none' : 'visible' }}
        />
        <Layer
          id="zijwegen-outline"
          beforeId="tochten-outline"
          type="line"
          paint={tochtOutlinePaint}
          layout={{ visibility: showHeatmap || !showZijwegen ? 'none' : 'visible' }}
        />
      </Source>
      <Source type="geojson" data={weidesLabelData}>
        <Layer
          id="weides-labels"
          beforeId="zijwegen-outline"
          type="symbol"
          layout={{
            'icon-allow-overlap': true,
            'text-field': ['get', 'name'],
            'text-size': 12,
            'text-font': ['D-DIN DIN-Bold', 'Arial Unicode MS Regular'],
            visibility: showHeatmap ? 'none' : 'visible',
          }}
          paint={{
            'text-opacity': showHeatmap ? 0 : 1,
            'text-color': grey[800],
          }}
          minzoom={13}
        />
      </Source>
      <Source type="geojson" data={weidesData}>
        <Layer
          id="weides"
          type="fill"
          beforeId="weides-labels"
          paint={{
            'fill-color': green[900],
            'fill-opacity': 0.8,
            'fill-outline-color': green[900],
          }}
          layout={{ visibility: showHeatmap ? 'none' : 'visible' }}
        />
      </Source>
      <Source type="geojson" data={forbiddenAreas || featureCollection([])}>
        <Layer
          id="forbidden-areas"
          type="fill"
          beforeId="weides"
          paint={{
            'fill-color': red[500],
            'fill-opacity': 0.5,
            'fill-outline-color': red[800],
          }}
          layout={{ visibility: showHeatmap ? 'none' : 'visible' }}
        />
      </Source>
      <Source type="vector" tiles={[contourUrl]}>
        <Layer
          id="contour-labels"
          type="symbol"
          source-layer="contours"
          filter={['>', ['get', 'level'], 0]}
          minzoom={11}
          layout={{
            'symbol-avoid-edges': true,
            'symbol-placement': 'line',
            'text-allow-overlap': false,
            'text-field': '{ele} m',
            'text-font': ['D-DIN Regular'],
            'text-ignore-placement': false,
            'text-padding': 10,
            'text-rotation-alignment': 'map',
            'text-keep-upright': false,
            'text-size': ['interpolate', ['linear'], ['zoom'], 15, 10, 20, 12],
            visibility: showHeatmap ? 'none' : 'visible',
          }}
          paint={{
            'text-color': 'hsl(0, 0%, 37%)',
            'text-halo-color': 'rgba(255, 255, 255, 0.8)',
            'text-halo-width': 1.5,
            'text-opacity': 1,
          }}
        />
        <Layer
          id="contour-lines-index"
          type="line"
          source-layer="contours"
          filter={['>', ['get', 'level'], 0]}
          minzoom={11}
          layout={{
            visibility: showHeatmap || showSatellite ? 'none' : 'visible',
          }}
          paint={{
            'line-color': 'hsl(28,8%,50%)',
            'line-opacity': ['interpolate', ['linear'], ['zoom'], 11.1, 0, 11.2, 0.2, 13, 0.4],
            'line-width': 0.8,
          }}
        />
        <Layer
          id="contour-lines"
          type="line"
          source-layer="contours"
          filter={['==', ['get', 'level'], 0]}
          minzoom={11}
          layout={{
            visibility: showHeatmap || showSatellite ? 'none' : 'visible',
          }}
          paint={{
            'line-color': 'rgb(136,124,111)',
            'line-opacity': ['interpolate', ['linear'], ['zoom'], 11.1, 0, 11.2, 0.15, 13, 0.3],
            'line-width': 0.4,
          }}
        />
      </Source>
    </>
  );
}
