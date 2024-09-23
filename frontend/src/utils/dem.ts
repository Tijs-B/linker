// @ts-expect-error No clue
import mlcontour from 'maplibre-contour';
import maplibregl from 'maplibre-gl';

const demSource = new mlcontour.DemSource({
  url: 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
  encoding: 'terrarium',
  maxzoom: 14,
  worker: true,
  cacheSize: 200,
  timeoutMs: 10_000,
});
demSource.setupMaplibre(maplibregl);

export const contourUrl = demSource.contourProtocolUrl({
  thresholds: {
    11: [100, 100],
    12: [50, 100],
    13: [20, 100],
    14: [10, 100],
  },
  overzoom: 1,
});

export const demUrl = demSource.sharedDemProtocolUrl;
