import {Layer, Source} from 'react-map-gl/maplibre';

import {grey, red} from '@mui/material/colors';
import {
    useGetFichesQuery,
    useGetForbiddenAreasQuery,
    useGetTochtenQuery,
    useGetZijwegenQuery
} from '../services/linker.js';
import {feature, featureCollection} from '@turf/helpers';
import {memo, useMemo} from 'react';

const BackgroundLayers = memo(function BackgroundLayers({showHeatmap}) {
    const {data: tochten} = useGetTochtenQuery();
    const {data: fiches} = useGetFichesQuery();
    const {data: zijwegen} = useGetZijwegenQuery();
    const {data: forbiddenAreas} = useGetForbiddenAreasQuery();

    const tochtenData = useMemo(() => {
        if (!tochten) {
            return null;
        }
        return featureCollection(Object.values(tochten.entities).map((tocht) => feature(tocht.route, {}, {id: tocht.id})))
    }, [tochten]);


    const fichesData = useMemo(() => {
        if (!tochten || !fiches) {
            return null;
        }
        return featureCollection(
            Object.values(fiches.entities).map((fiche) =>
                feature(
                    fiche.point,
                    {name: `${tochten.entities[fiche.tocht].identifier}${fiche.order}`},
                    {id: fiche.id},
                ),
            )
        )
    }, [fiches, tochten]);

    const zijwegenData = useMemo(() => {
        if (!zijwegen) {
            return null;
        }
        return featureCollection(Object.values(zijwegen.entities).map((zijweg) => feature(zijweg.geom, {}, {id: zijweg.id})))
    }, [zijwegen]);

    const forbiddenAreasData = useMemo(() => {
        if (!forbiddenAreas) {
            return null;
        }
        return featureCollection(forbiddenAreas.map((area) => feature(area.area, {description: area.description}, {id: area.id})))
    }, [forbiddenAreas])

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
            'text-font': ['D-DIN DIN-Bold', 'Arial Unicode MS Regular'],
            'text-max-width': 5,
        },
        paint: {
            'text-opacity': showHeatmap ? 0 : 1,
            'text-color': grey[800],
        },
        minzoom: 13,
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
        minzoom: 13,
    };

    const forbiddenAreasLayer = {
        id: 'forbidden-areas',
        type: 'fill',
        beforeId: 'zijwegen-outline',
        paint: {
            'fill-color': red[500],
            'fill-opacity': 0.5,
            'fill-outline-color': red[800],
        }
    }

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
                <Layer id="heatmap" type="raster" layout={{visibility: showHeatmap ? 'visible' : 'none'}}/>
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
                <Layer layout={{visibility: showHeatmap ? 'none' : 'visible'}} {...zijwegenOutlineLayer} />
            </Source>
            <Source type="geojson" data={forbiddenAreasData}>
                <Layer layout={{visibility: showHeatmap ? 'none' : 'visible'}} {...forbiddenAreasLayer}/>
            </Source>
        </>
    );
});

export default BackgroundLayers;
