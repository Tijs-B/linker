import {Layer, Source} from 'react-map-gl/maplibre';

import {red} from '@mui/material/colors';
import {useSelector} from 'react-redux';
import {useGetTrackerTrackQuery} from "../services/linker.js";
import {skipToken} from "@reduxjs/toolkit/query";
import {memo} from "react";

const TrackerHistoryLayer = memo(function TrackerHistoryLayer() {
    const selectedId = useSelector((state) => state.trackers.selectedId);
    const {currentData: track} = useGetTrackerTrackQuery(selectedId ? selectedId : skipToken);

    const layerStyle = {
        id: 'tracker-history',
        beforeId: 'trackers',
        type: 'line',
        paint: {
            'line-color': red[500],
            'line-width': 4,
            'line-opacity': selectedId && track ? 1 : 0,
            'line-opacity-transition': {duration: 200},
        },
    };

    const outlineStyle = {
        id: 'tracker-history-outline',
        beforeId: 'tracker-history',
        type: 'line',
        paint: {
            'line-color': '#fff',
            'line-width': 6,
            'line-opacity': selectedId && track ? 1 : 0,
            'line-opacity-transition': {duration: 200},
        },
    };

    return (
        <>
            { track && (
                <Source data={track} type="geojson">
                    <Layer {...layerStyle} />
                    <Layer {...outlineStyle} />
                </Source>
            )}
        </>
    );
});

export default TrackerHistoryLayer;
