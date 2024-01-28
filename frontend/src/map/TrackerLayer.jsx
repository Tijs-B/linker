import {useEffect, useMemo} from 'react';
import {Layer, Source, useMap} from 'react-map-gl/maplibre';
import {useDispatch, useSelector} from 'react-redux';

import {trackersActions} from '../store';
import {itemColor} from '../theme/colors.js';
import {useGetOrganizationMembersQuery, useGetTeamsQuery, useGetTrackersQuery} from "../services/linker.js";
import {generateTracker, generateTrackerOutline} from "../utils/icons.js";

export default function TrackerLayer({visible}) {
    const dispatch = useDispatch();
    const selectedId = useSelector((state) => state.trackers.selectedId);
    const showHistory = useSelector((state) => state.trackers.showHistory);

    const historyLog = useSelector((state) => state.trackers.historyLog);

    const {data: teams} = useGetTeamsQuery();
    const {data: organizationMembers} = useGetOrganizationMembersQuery();
    const {data: trackers} = useGetTrackersQuery();


    const {mainMap} = useMap();

    useEffect(() => {
        const onMouseEnter = function () {
            mainMap.getCanvas().style.cursor = 'pointer';
        };

        const onMouseLeave = function () {
            mainMap.getCanvas().style.cursor = '';
        };

        const onClick = (e) => {
            e.features.sort((a, b) => b.properties.sortKey - a.properties.sortKey);
            dispatch(trackersActions.setSelectedId(e.features[0].id));
        };

        const onImageMissing = function (e) {
            const id = e.id;
            const prefix = 'trackermarker-';
            if (id.includes(prefix)) {
                const [code, color] = id.replace(prefix, '').split('-');
                mainMap.addImage(id, generateTracker(code, color));
            } else if (id == 'trackermarkerbackground') {
                mainMap.addImage('trackermarkerbackground', generateTrackerOutline());
            }
        };

        mainMap.on('mouseenter', 'trackers', onMouseEnter);
        mainMap.on('mouseleave', 'trackers', onMouseLeave);
        mainMap.on('click', 'trackers', onClick);
        mainMap.on('styleimagemissing', onImageMissing);

        return () => {
            mainMap.off('mouseenter', 'trackers', onMouseEnter);
            mainMap.off('mouseleave', 'trackers', onMouseLeave);
            mainMap.off('click', 'trackers', onClick);
            mainMap.off('styleimagemissing', onImageMissing);
        };
    }, [mainMap, dispatch]);

    const allFeatures = useMemo(() => {
        if (!trackers) {
            return [];
        }
        return (teams ? Object.values(teams.entities) : [])
            .concat((organizationMembers ? Object.values(organizationMembers.entities) : []))
            .flatMap((item) => {
                const last_log = trackers.entities[item.tracker]?.last_log;
                if (last_log) {
                    const code = 'number' in item ? item.number.toString().padStart(2, '0') : item.code;
                    return [
                        {
                            type: 'Feature',
                            geometry: last_log.point,
                            id: item.tracker,
                            properties: {
                                image: `trackermarker-${code}-${itemColor(item)}`,
                                sortKey: selectedId === item.tracker ? 100 : 100 - last_log.point.coordinates[1],
                            },
                        },
                    ];
                } else {
                    return [];
                }
            });
    }, [teams, organizationMembers, trackers, selectedId]);

    const historyFeature = useMemo(() => {
        if (historyLog) {
            const team = Object.values(teams.entities).find((t) => t.tracker === selectedId);
            const member = Object.values(organizationMembers.entities).find((m) => m.tracker === selectedId);
            const item = team || member;
            const code = team ? team.number.toString().padStart(2, '0') : member.code;
            return {
                type: 'Feature',
                geometry: historyLog.point,
                id: item.tracker.id,
                properties: {
                    image: `trackermarker-${code}-${itemColor(item)}`,
                    sortKey: 0,
                },
            };
        } else {
            return null;
        }
    }, [teams, organizationMembers, selectedId, historyLog]);

    const geojsonData = {
        type: 'FeatureCollection',
        features: showHistory && historyFeature ? [historyFeature] : allFeatures,
    };

    const selectedData = useMemo(() => {
        if (!showHistory && selectedId && trackers.entities[selectedId]?.last_log) {
            return {
                type: 'FeatureCollection',
                features: [{type: 'Feature', geometry: trackers.entities[selectedId].last_log.point}],
            };
        } else {
            return {type: 'FeatureCollection', features: []};
        }
    }, [trackers, selectedId, showHistory]);

    return (
        <>
            <Source type="geojson" data={selectedData}>
                <Layer
                    type="symbol"
                    id="trackerBackground"
                    beforeId="map-notes"
                    layout={{
                        'icon-allow-overlap': true,
                        'icon-ignore-placement': true,
                        'icon-image': 'trackermarkerbackground',
                        'icon-offset': [0, -16.5 * 2],
                        'icon-size': 0.5,
                        visibility: visible ? 'visible' : 'none',
                    }}
                />
            </Source>
            <Source type="geojson" data={geojsonData}>
                <Layer
                    type="symbol"
                    id="trackers"
                    beforeId="trackerBackground"
                    layout={{
                        'icon-allow-overlap': true,
                        'icon-ignore-placement': true,
                        'icon-image': ['get', 'image'],
                        'icon-offset': [0, -16.5 * 2],
                        'icon-size': 0.5,
                        'symbol-sort-key': ['get', 'sortKey'],
                        visibility: visible ? 'visible' : 'none',
                    }}
                />
            </Source>
        </>
    );
}
