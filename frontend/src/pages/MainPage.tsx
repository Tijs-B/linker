import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMap } from 'react-map-gl/maplibre';
import { useNavigate } from 'react-router-dom';

import { Paper, useMediaQuery, useTheme } from '@mui/material';

import { css } from '@emotion/react';
import Fuse from 'fuse.js';
import { SnackbarKey, useSnackbar } from 'notistack';

import BottomMenu from '../components/main/BottomMenu';
import HistoryCard from '../components/main/HistoryCard';
import MainToolbar from '../components/main/MainToolbar';
import SearchList from '../components/main/SearchList';
import StatusCard from '../components/main/StatusCard';
import MainMap from '../components/map/MainMap';
import {
  useGetOrganizationMembersQuery,
  useGetTeamsQuery,
  useGetTrackersQuery,
  useGetUserQuery,
} from '../services/linker';
import { Direction, Team } from '../services/types.ts';
import { trackersActions, useAppDispatch, useAppSelector } from '../store/index.ts';

export default function MainPage() {
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));

  const [keyword, setKeyword] = useState('');
  const [listOpen, setListOpen] = useState(desktop);
  const [networkErrorNotificationId, setNetworkErrorNotificationId] = useState<SnackbarKey | null>(
    null,
  );
  const { mainMap } = useMap();
  const navigate = useNavigate();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const dispatch = useAppDispatch();
  const selectedId = useAppSelector((state) => state.trackers.selectedId);
  const showHistory = useAppSelector((state) => state.trackers.showHistory);
  const showSafe = useAppSelector((state) => state.filter.showSafe);
  const showMembers = useAppSelector((state) => state.filter.showMembers);
  const showRed = useAppSelector((state) => state.filter.showRed);
  const showBlue = useAppSelector((state) => state.filter.showBlue);

  const {
    data: teams,
    isFetching: isFetchingTeams,
    refetch: refetchTeams,
  } = useGetTeamsQuery(undefined, {
    pollingInterval: 60_000,
    skipPollingIfUnfocused: true,
  });
  const {
    data: organizationMembers,
    isFetching: isFetchingMembers,
    refetch: refetchMembers,
  } = useGetOrganizationMembersQuery(undefined, {
    pollingInterval: 60_000,
    skipPollingIfUnfocused: true,
  });
  const {
    data: trackers,
    isFetching: isFetchingTrackers,
    refetch: refetchTrackers,
  } = useGetTrackersQuery(undefined, {
    pollingInterval: 15_000,
    skipPollingIfUnfocused: true,
  });
  const { currentData: user, error: queryError } = useGetUserQuery(undefined, {
    pollingInterval: 5_000,
    skipPollingIfUnfocused: true,
  });

  // Navigate to login page if unauthenticated
  useEffect(() => {
    if (user && user.username === null) {
      navigate('/login/');
    }
  }, [navigate, user]);

  // Check query error for network errors
  useEffect(() => {
    if (queryError !== undefined && networkErrorNotificationId === null) {
      const id = enqueueSnackbar('Geen internetverbinding', {
        variant: 'warning',
        preventDuplicate: true,
        persist: true,
      });
      setNetworkErrorNotificationId(id);
    } else if (queryError === undefined && networkErrorNotificationId !== null) {
      closeSnackbar(networkErrorNotificationId);
      setNetworkErrorNotificationId(null);
      enqueueSnackbar('Internetverbinding hersteld', {
        variant: 'success',
        preventDuplicate: true,
      });
    }
  }, [dispatch, enqueueSnackbar, navigate, queryError, networkErrorNotificationId, closeSnackbar]);

  // Close the list on mobile when team is selected
  useEffect(() => {
    if (!desktop && selectedId !== null) {
      setListOpen(false);
    }
  }, [desktop, selectedId]);

  const showTracker = useCallback(
    (tracker: number | null) => {
      if (tracker !== null) {
        mainMap?.easeTo({
          // @ts-expect-error there are always 2 coordinates here
          center: trackers?.entities[tracker].last_log?.point.coordinates,
          zoom: 14,
        });
      }
    },
    [mainMap, trackers],
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
      return teams.ids
        .map((id) => teams.entities[id])
        .filter((team) => showSafe || !team.safe_weide)
        .filter((team) => showRed || team.direction !== Direction.RED)
        .filter((team) => showBlue || team.direction !== Direction.BLUE);
    } else {
      return [];
    }
  }, [teamFuse, keyword, teams, showSafe, showRed, showBlue]);

  const filteredMembers = useMemo(() => {
    if (!showMembers) {
      return [];
    } else if (memberFuse && keyword) {
      return memberFuse.search(keyword).map((item) => item.item);
    } else if (organizationMembers) {
      return organizationMembers.ids.map((id) => organizationMembers.entities[id]);
    } else {
      return [];
    }
  }, [keyword, memberFuse, organizationMembers, showMembers]);

  const onSearchEnter = useCallback(
    (keyword: string) => {
      if (keyword && teamFuse && memberFuse) {
        const teamResults = teamFuse.search(keyword);
        const memberResults = memberFuse.search(keyword);
        if (teamResults.length === 0 && memberResults.length === 0) {
          return;
        } else if (teamResults.length === 0) {
          showTracker(memberResults[0].item.tracker);
          dispatch(trackersActions.selectMember(memberResults[0].item.id));
        } else if (memberResults.length === 0) {
          showTracker(teamResults[0].item.tracker);
          dispatch(trackersActions.selectTeam(teamResults[0].item.id));
        } else {
          if (teamResults[0].score! > memberResults[0].score!) {
            showTracker(teamResults[0].item.tracker);
            dispatch(trackersActions.selectTeam(teamResults[0].item.id));
          } else {
            showTracker(memberResults[0].item.tracker);
            dispatch(trackersActions.selectMember(memberResults[0].item.id));
          }
        }
      }
    },
    [teamFuse, memberFuse, showTracker, dispatch],
  );

  const onChangeKeyword = useCallback((keyword: string) => {
    if (keyword) {
      setListOpen(true);
    }
    setKeyword(keyword);
  }, []);

  const onForceUpdate = useCallback(() => {
    refetchMembers();
    refetchTeams();
    refetchTrackers();
  }, [refetchMembers, refetchTeams, refetchTrackers]);

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
      {desktop && <MainMap filteredTeams={filteredTeams} filteredMembers={filteredMembers} />}

      <div css={sidebar}>
        <Paper elevation={3} square css={header}>
          <MainToolbar
            keyword={keyword}
            onChangeKeyword={onChangeKeyword}
            onSearchEnter={onSearchEnter}
            listOpen={listOpen}
            setListOpen={setListOpen}
            isUpdating={isFetchingTeams || isFetchingMembers || isFetchingTrackers}
            onForceUpdate={onForceUpdate}
          />
        </Paper>
        <div css={middle}>
          {!desktop && (
            <div css={contentMap}>
              <MainMap filteredTeams={filteredTeams} filteredMembers={filteredMembers} />
            </div>
          )}
          <Paper css={contentList} sx={{ visibility: listOpen ? 'visible' : 'hidden' }} square>
            <SearchList members={filteredMembers} teams={filteredTeams} onClick={showTracker} />
          </Paper>
        </div>
        {desktop && (
          <div css={footer}>
            <BottomMenu />
          </div>
        )}
      </div>
      {selectedId !== null && !showHistory && <StatusCard />}
      {selectedId !== null && showHistory && <HistoryCard />}
    </div>
  );
}
