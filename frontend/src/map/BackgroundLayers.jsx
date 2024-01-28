import {Layer, Source} from 'react-map-gl/maplibre';

import {grey} from '@mui/material/colors';
import {useGetFichesQuery, useGetTochtenQuery, useGetZijwegenQuery} from "../services/linker.js";

export default function BackgroundLayers({showHeatmap}) {
    const {data: tochten} = useGetTochtenQuery();
    const {data: fiches} = useGetFichesQuery();
    const {data: zijwegen} = useGetZijwegenQuery();

    const tochtenData = {
        type: 'FeatureCollection',
        features: tochten ? Object.values(tochten.entities).map((tocht) => ({
            type: 'Feature',
            geometry: tocht.route,
            id: tocht.id,
        })) : [],
    };

    const fichesData = {
        type: 'FeatureCollection',
        features: fiches ? Object.values(fiches.entities).map((fiche) => ({
            type: 'Feature',
            geometry: fiche.point,
            properties: {name: `${tochten?.entities[fiche.tocht]?.identifier}${fiche.order}`},
            id: fiche.id,
        })) : [],
    };

    const zijwegenData = {
        type: 'FeatureCollection',
        features: zijwegen ? Object.values(zijwegen.entities).map((zijweg) => ({
            type: 'Feature',
            geometry: zijweg.geom,
            id: zijweg.id,
        })) : [],
    };

    const tochtenLayer = {
        id: 'tochten',
        beforeId: 'fiches-circles',
        type: 'line',
        paint: {
            'line-width': 3,
            'line-color': grey[800],
        },
    };

    const tochtenOutlineLayer = {
        id: 'tochten-outline',
        beforeId: 'tochten',
        type: 'line',
        paint: {
            'line-width': 5,
            'line-color': '#fff',
        },
    };

    const zijwegenLayer = {
        id: 'zijwegen',
        beforeId: 'tochten',
        type: 'line',
        paint: {
            'line-width': 3,
            'line-color': grey[800],
        },
    };

    const zijwegenOutlineLayer = {
        id: 'zijwegen-outline',
        beforeId: 'tochten-outline',
        type: 'line',
        paint: {
            'line-width': 5,
            'line-color': '#fff',
        },
    };

    const fichesLayer = {
        id: 'fiches',
        type: 'symbol',
        layout: {
            'icon-allow-overlap': true,
            'text-field': ['get', 'name'],
            'text-size': 10,
            'text-font': ['DIN Pro Bold', 'Arial Unicode MS Regular'],
            'text-max-width': 5,
        },
        paint: {
            'text-opacity': showHeatmap ? 0 : 1,
            'text-color': grey[800],
        },
        minzoom: 14,
    };

    const fichesCircleLayer = {
        id: 'fiches-circles',
        beforeId: 'fiches',
        type: 'circle',
        paint: {
            'circle-color': '#fff',
            'circle-radius': 10,
            'circle-stroke-color': grey[800],
            'circle-stroke-width': 1.5,
        },
        minzoom: 14,
    };

    return (
        <>
            <Source
                type="raster"
                scheme="xyz"
                minZoom={9}
                maxzoom={16}
                tileSize={256}
                tiles={['/api/heatmap/{z}/{x}/{y}.png']}
            >
                <Layer
                    id="heatmap"
                    type="raster"
                    layout={{visibility: showHeatmap ? 'visible' : 'none'}}
                />
            </Source>

            <Source type="geojson" data={fichesData}>
                <Layer layout={{visibility: showHeatmap ? 'none' : 'visible'}} {...fichesLayer} />
                <Layer layout={{visibility: showHeatmap ? 'none' : 'visible'}} {...fichesCircleLayer} />
            </Source>
            <Source type="geojson" data={tochtenData}>
                <Layer layout={{visibility: showHeatmap ? 'none' : 'visible'}} {...tochtenLayer} />
                <Layer layout={{visibility: showHeatmap ? 'none' : 'visible'}} {...tochtenOutlineLayer} />
            </Source>
            <Source type="geojson" data={zijwegenData}>
                <Layer layout={{visibility: showHeatmap ? 'none' : 'visible'}} {...zijwegenLayer} />
                <Layer
                    layout={{visibility: showHeatmap ? 'none' : 'visible'}}
                    {...zijwegenOutlineLayer}
                />
            </Source>
        </>
    );
}
