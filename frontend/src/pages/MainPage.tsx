import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMap } from 'react-map-gl/maplibre';
import { useNavigate } from 'react-router-dom';

import { Paper, useMediaQuery, useTheme } from '@mui/material';

import { css } from '@emotion/react';
import Fuse from 'fuse.js';

import BottomMenu from '../components/main/BottomMenu';
import HistoryCard from '../components/main/HistoryCard';
import MainToolbar from '../components/main/MainToolbar';
import SearchList from '../components/main/SearchList';
import StatusCard from '../components/main/StatusCard';
import MainMap from '../map/MainMap';
import {
  useGetOrganizationMembersQuery,
  useGetTeamsQuery,
  useGetTrackersQuery,
} from '../services/linker';
import { Team } from '../services/types.ts';
import { trackersActions, useAppDispatch, useAppSelector } from '../store/index.ts';

export default function MainPage() {
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));

  const [keyword, setKeyword] = useState('');
  const [listOpen, setListOpen] = useState(desktop);
  const [filterSafe, setFilterSafe] = useState(true);
  const [filterMembers, setFilterMembers] = useState(true);
  const { mainMap } = useMap();
  const navigate = useNavigate();

  const dispatch = useAppDispatch();
  const selectedId = useAppSelector((state) => state.trackers.selectedId);
  const showHistory = useAppSelector((state) => state.trackers.showHistory);

  const { data: teams, error: queryError } = useGetTeamsQuery();
  const { data: organizationMembers } = useGetOrganizationMembersQuery();
  const { data: trackers } = useGetTrackersQuery();

  // Navigate to login if unauthenticated
  useEffect(() => {
    if (queryError && 'status' in queryError && queryError.status === 403) {
      navigate('/login/');
    }
  }, [navigate, queryError]);

  // Close the list on mobile when team is selected
  useEffect(() => {
    if (!desktop && selectedId) {
      setListOpen(false);
    }
  }, [desktop, selectedId]);

  const showItem = useCallback(
    (tracker: number) => {
      dispatch(trackersActions.setSelectedId(tracker));
      mainMap?.easeTo({
        // @ts-expect-error there are always 2 coordinates here
        center: trackers?.entities[tracker].last_log?.point.coordinates,
        zoom: 14,
      });
    },
    [dispatch, mainMap, trackers],
  );

  // Create fuse objects for search
  const teamFuse = useMemo(() => {
    if (teams && teams.ids.length > 0) {
      return new Fuse(Object.values(teams.entities), {
        keys: ['code', 'name', 'contact_persons.name', 'chiro'],
        threshold: 0.2,
        includeScore: true,
      });
    }
  }, [teams]);

  const memberFuse = useMemo(() => {
    if (organizationMembers && organizationMembers.ids.length > 0) {
      return new Fuse(Object.values(organizationMembers.entities), {
        keys: ['name', 'code'],
        threshold: 0.2,
        includeScore: true,
      });
    }
  }, [organizationMembers]);

  const filteredTeams: Team[] = useMemo(() => {
    if (teamFuse && keyword) {
      return teamFuse.search(keyword).map((item) => item.item);
    } else if (teams) {
      return Object.values(teams.entities).filter((team) => filterSafe || !team.safe_weide);
    } else {
      return [];
    }
  }, [keyword, teams, teamFuse, filterSafe]);

  const filteredMembers = useMemo(() => {
    if (!filterMembers) {
      return [];
    } else if (memberFuse && keyword) {
      return memberFuse.search(keyword).map((item) => item.item);
    } else if (organizationMembers) {
      return Object.values(organizationMembers.entities);
    } else {
      return [];
    }
  }, [filterMembers, keyword, memberFuse, organizationMembers]);

  const filteredTrackers = useMemo(
    () =>
      filteredTeams
        .map((t) => t.tracker)
        .concat(filteredMembers.map((m) => m.tracker))
        .flatMap((tracker) => (tracker ? [tracker] : [])),
    [filteredTeams, filteredMembers],
  );

  const onSearchEnter = useCallback(
    (keyword: string) => {
      if (keyword && teamFuse && memberFuse) {
        const results = teamFuse.search(keyword).concat(memberFuse.search(keyword));
        if (results.length > 0) {
          const highest = results.sort((a, b) => a.score! - b.score!)[0].item;
          if (highest.tracker) {
            showItem(highest.tracker);
          }
        }
      }
    },
    [memberFuse, teamFuse, showItem],
  );

  const onChangeKeyword = useCallback((keyword: string) => {
    if (keyword) {
      setListOpen(true);
    }
    setKeyword(keyword);
  }, []);

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
      {desktop && <MainMap trackers={filteredTrackers} />}

      <div css={sidebar}>
        <Paper elevation={3} square css={header}>
          <MainToolbar
            keyword={keyword}
            onChangeKeyword={onChangeKeyword}
            onSearchEnter={onSearchEnter}
            listOpen={listOpen}
            setListOpen={setListOpen}
            filterSafe={filterSafe}
            setFilterSafe={setFilterSafe}
            filterMembers={filterMembers}
            setFilterMembers={setFilterMembers}
          />
        </Paper>
        <div css={middle}>
          {!desktop && (
            <div css={contentMap}>
              <MainMap trackers={filteredTrackers} />
            </div>
          )}
          <Paper css={contentList} sx={{ visibility: listOpen ? 'visible' : 'hidden' }} square>
            <SearchList members={filteredMembers} teams={filteredTeams} onClick={showItem} />
          </Paper>
        </div>
        {desktop && (
          <div css={footer}>
            <BottomMenu />
          </div>
        )}
      </div>
      {selectedId && !showHistory && <StatusCard />}
      {selectedId && showHistory && <HistoryCard />}
    </div>
  );
}
