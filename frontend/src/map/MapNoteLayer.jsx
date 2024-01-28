import {useEffect} from 'react';
import {Layer, Source, useMap} from 'react-map-gl/maplibre';

import {yellow} from '@mui/material/colors';
import {useGetMapNotesQuery} from "../services/linker.js";
import {generateMapNoteIcon} from "../utils/icons.js";

export default function MapNoteLayer({visible}) {
    const {mainMap} = useMap();

    const {data: mapNotes} = useGetMapNotesQuery();

    const geojsonData = {
        type: 'FeatureCollection',
        features: mapNotes ? Object.values(mapNotes.entities).map((mapNote) => ({
            type: 'Feature',
            id: mapNote.id,
            geometry: mapNote.point,
        })) : [],
    };

    useEffect(() => {
        const onImageMissing = function (e) {
            if (e.id === 'map-note') {
                mainMap.addImage(e.id, generateMapNoteIcon(yellow[400]));
            }
        };

        mainMap.on('styleimagemissing', onImageMissing);

        return () => mainMap.off('styleimagemissing', onImageMissing);
    }, [mainMap]);

    useEffect(() => {
        const onMouseEnter = function () {
            mainMap.getCanvas().style.cursor = 'pointer';
        };

        const onMouseLeave = function () {
            mainMap.getCanvas().style.cursor = '';
        };

        const onClick = (e) => {
            // TODO: dit
        };

        mainMap.on('mouseenter', 'map-notes', onMouseEnter);
        mainMap.on('mouseleave', 'map-notes', onMouseLeave);
        mainMap.on('click', 'map-notes', onClick);

        return () => {
            mainMap.off('mouseenter', 'map-notes', onMouseEnter);
            mainMap.off('mouseleave', 'map-notes', onMouseLeave);
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
}
