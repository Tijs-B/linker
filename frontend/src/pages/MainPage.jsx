import {memo, useCallback, useEffect, useMemo, useState} from 'react';
import {useMap} from 'react-map-gl/maplibre';
import {useDispatch, useSelector} from 'react-redux';

import {Paper, useMediaQuery, useTheme} from '@mui/material';

import {css} from '@emotion/react';
import Fuse from 'fuse.js';

import BottomMenu from '../components/main/BottomMenu.jsx';
import HistoryCard from '../components/main/HistoryCard.jsx';
import MainToolbar from '../components/main/MainToolbar.jsx';
import SearchList from '../components/main/SearchList.jsx';
import StatusCard from '../components/main/StatusCard.jsx';
import MainMap from '../map/MainMap.jsx';
import {trackersActions} from '../store/index.js';
import {useGetOrganizationMembersQuery, useGetTeamsQuery, useGetTrackersQuery} from "../services/linker.js";
import {useNavigate} from "react-router-dom";

export default memo(function MainPage() {
    const theme = useTheme();
    const desktop = useMediaQuery(theme.breakpoints.up('md'));

    const [keyword, setKeyword] = useState('');
    const [listOpen, setListOpen] = useState(desktop);
    const {mainMap} = useMap();
    const navigate = useNavigate();

    const dispatch = useDispatch();
    const selectedId = useSelector((state) => state.trackers.selectedId);
    const showHistory = useSelector((state) => state.trackers.showHistory);

    const {data: teams, error: queryError} = useGetTeamsQuery();
    const {data: organizationMembers} = useGetOrganizationMembersQuery();
    const {data: trackers} = useGetTrackersQuery();

    // Navigate to login if unauthenticated
    useEffect(() => {
        if (queryError && queryError.status === 403) {
            navigate('/login/')
        }
    }, [queryError])

    // Close the list on mobile when team is selected
    useEffect(() => {
        if (!desktop && selectedId) {
            setListOpen(false);
        }
    }, [desktop, selectedId]);

    // Open the list when a keyword is entered
    useEffect(() => {
        if (keyword) {
            setListOpen(true);
        }
    }, [keyword])


    const showItem = useCallback((tracker) => {
        dispatch(trackersActions.setSelectedId(tracker));
        mainMap.easeTo({
            center: trackers.entities[tracker].last_log.point.coordinates,
            zoom: 14,
        });
    }, [dispatch, mainMap, trackers]);

    // Create fuse objects for search
    const teamFuse = useMemo(() => {
        if (teams && teams.ids.length > 0) {
            const data = Object.values(teams.entities).map((team) => ({
                ...team,
                number: team.number.toString().padStart(2, '0'),
            }));
            const fuse = new Fuse(data, {
                keys: ['number', 'name', 'contact_persons.name', 'chiro'],
                threshold: 0.2,
                includeScore: true,
            });
            return fuse;
        }
    }, [teams]);

    const memberFuse = useMemo(() => {
        if (organizationMembers && organizationMembers.ids.length > 0) {
            const fuse = new Fuse(Object.values(organizationMembers.entities), {
                keys: ['name', 'code'],
                threshold: 0.2,
                includeScore: true,
            });
            return fuse;
        }
    }, [organizationMembers]);

    const filteredTeams = useMemo(() => {
        if (teamFuse && keyword) {
            return teamFuse.search(keyword).map((item) => item.item);
        } else if (teams) {
            return Object.values(teams.entities);
        } else {
            return [];
        }
    }, [keyword, teams, teamFuse]);

    const filteredMembers = useMemo(() => {
        if (memberFuse && keyword) {
            return memberFuse.search(keyword).map((item) => item.item);
        } else if (organizationMembers) {
            return Object.values(organizationMembers.entities);
        } else {
            return [];
        }
    }, [keyword, memberFuse, organizationMembers]);

    const filteredTrackers = filteredTeams.map((t) => t.tracker).concat(filteredMembers.map((m) => m.tracker));

    const onSearchEnter = function (keyword) {
        if (keyword) {
            const results = teamFuse.search(keyword).concat(memberFuse.search(keyword));
            if (results.length > 0) {
                const highest = results.sort((a, b) => a.score - b.score)[0].item;
                showItem(highest.tracker);
            }
        }
    };

    const sidebar = css`
        display: flex;
        flex-direction: column;
        pointer-events: none;

        ${theme.breakpoints.up('md')} {
            position: fixed;
            left: 0;
            top: 0;
            height: calc(100% - ${theme.spacing(3)});
            width: ${theme.dimensions.drawerWidthDesktop};
            margin: ${theme.spacing(1.5)};
            z-index: 3;
        }

        ${theme.breakpoints.down('md')} {
            height: 100%;
            width: 100%;
        }
    `;

    const header = css`
        z-index: 6;
        pointer-events: auto;
    `;

    const middle = css`
        flex: 1;
        display: grid;
    `;

    const footer = css`
        pointer-events: auto;
        z-index: 5;
    `;

    const contentMap = css`
        pointer-events: auto;
        grid-area: 1 / 1;
    `;

    const contentList = css`
        pointer-events: auto;
        grid-area: 1 / 1;
        z-index: 4;
    `;

    return (
        <div
            css={css`
                height: 100%;
            `}
        >
            {desktop && (
                <MainMap trackers={filteredTrackers}/>
            )}

            <div css={sidebar}>
                <Paper elevation={3} square css={header}>
                    <MainToolbar
                        keyword={keyword}
                        setKeyword={setKeyword}
                        onSearchEnter={onSearchEnter}
                        listOpen={listOpen}
                        setListOpen={setListOpen}
                    />
                </Paper>
                <div css={middle}>
                    {!desktop && (
                        <div css={contentMap}>
                            <MainMap trackers={filteredTrackers}/>
                        </div>
                    )}
                    <Paper css={contentList} sx={{visibility: listOpen ? 'visible' : 'hidden'}} square>
                        <SearchList members={filteredMembers} teams={filteredTeams} onClick={showItem}/>
                    </Paper>
                </div>
                {desktop && (
                    <div css={footer}>
                        <BottomMenu/>
                    </div>
                )}
            </div>
            {selectedId && !showHistory && <StatusCard/>}
            {selectedId && showHistory && <HistoryCard/>}
        </div>
    );
})
