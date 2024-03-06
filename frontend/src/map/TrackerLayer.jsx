import {memo, useCallback, useEffect, useMemo, useState} from 'react';
import {Layer, Source, useMap} from 'react-map-gl/maplibre';
import {useDispatch, useSelector} from 'react-redux';

import {trackersActions} from '../store';
import {itemColor} from '../theme/colors.js';
import {useGetOrganizationMembersQuery, useGetTeamsQuery, useGetTrackersQuery} from "../services/linker.js";
import {generateTracker, generateTrackerOutline} from "../utils/icons.js";
import {feature, featureCollection} from "@turf/helpers";

export default memo(function TrackerLayer({visible, trackers}) {
    const [cursor, setCursor] = useState('auto');

    const dispatch = useDispatch();
    const selectedId = useSelector((state) => state.trackers.selectedId);
    const showHistory = useSelector((state) => state.trackers.showHistory);

    const historyLog = useSelector((state) => state.trackers.historyLog);

    const {data: teams} = useGetTeamsQuery();
    const {data: organizationMembers} = useGetOrganizationMembersQuery();
    const {data: allTrackers} = useGetTrackersQuery({
        pollingInterval: 10_000,
        skipPollingIfUnfocused: true,
    });

    const {mainMap} = useMap();

    const onMouseEnter = useCallback()

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

    const trackerIds = historyLog && selectedId ? [selectedId] : trackers;

    const geoJsonData = useMemo(() => {
        let features = trackerIds.flatMap((trackerId) => {
            const lastLog = allTrackers?.entities[trackerId]?.last_log;
            if (!lastLog) {
                return [];
            }
            const team = Object.values(teams.entities).find((t) => t.tracker === trackerId);
            const member = Object.values(organizationMembers.entities).find((m) => m.tracker === trackerId);
            const item = team || member;
            const code = team ? team.number.toString().padStart(2, '0') : member.code;
            const point = historyLog ? historyLog.point : lastLog.point;
            const props = {
                image: `trackermarker-${code}-${itemColor(item)}`,
                sortKey: selectedId === item.tracker ? 100 : 100 - point.coordinates[1],
            };
            return [feature(point, props, {id: item.tracker})];
        });
        return featureCollection(features);
    }, [teams, organizationMembers, allTrackers, trackerIds, selectedId, historyLog])

    const selectedData = useMemo(() => {
        if (!showHistory && selectedId && allTrackers.entities[selectedId]?.last_log) {
            return featureCollection([feature(allTrackers.entities[selectedId].last_log.point)])
        } else {
            return featureCollection([]);
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
            <Source type="geojson" data={geoJsonData}>
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
})
