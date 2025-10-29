import { useCallback, useEffect, useMemo, useState } from 'react';
import type { LngLat } from 'react-map-gl/maplibre';
import { useMap } from 'react-map-gl/maplibre';
import { Navigate } from 'react-router-dom';

import { Paper, useMediaQuery, useTheme } from '@mui/material';

import { css } from '@emotion/react';
import Fuse from 'fuse.js';
import type { SnackbarKey } from 'notistack';
import { useSnackbar } from 'notistack';

import BottomMenu from '../components/main/BottomMenu';
import CreateMapNoteDialog from '../components/main/CreateMapNoteDialog.tsx';
import CreateTrackerLogDialog from '../components/main/CreateTrackerLogDialog.tsx';
import HistoryCard from '../components/main/HistoryCard';
import MainToolbar from '../components/main/MainToolbar';
import NotificationList from '../components/main/NotificationList.tsx';
import StatusCard from '../components/main/StatusCard';
import TrackerList from '../components/main/TrackerList.tsx';
import MainMap from '../components/map/MainMap';
import {
  useGetNotificationsQuery,
  useGetOrganizationMembersQuery,
  useGetTeamsQuery,
  useGetTrackersQuery,
  useGetUserQuery,
} from '../services/linker';
import type { Team } from '../services/types.ts';
import { Direction } from '../services/types.ts';
import { trackersActions, useAppDispatch, useAppSelector } from '../store/index.ts';

export default function MainPage() {
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));

  const [keyword, setKeyword] = useState('');
  const [listOpen, setListOpen] = useState(desktop);
  const [showNotifications, setShowNotifications] = useState(false);
  const [networkErrorNotificationId, setNetworkErrorNotificationId] = useState<SnackbarKey | null>(
    null,
  );
  const [creatingMarker, setCreatingMarker] = useState<'mapNote' | 'tracker' | null>(null);
  const [mapNoteLngLat, setMapNoteLngLat] = useState<LngLat | null>(null);
  const [trackerLogLngLat, setTrackerLogLngLat] = useState<LngLat | null>(null);
  const { mainMap } = useMap();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const dispatch = useAppDispatch();
  const selectedId = useAppSelector((state) => state.trackers.selectedId);
  const showHistory = useAppSelector((state) => state.trackers.showHistory);
  const showSafe = useAppSelector((state) => state.filter.showSafe);
  const showBus = useAppSelector((state) => state.filter.showBus);
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
    pollingInterval: 6_000,
    skipPollingIfUnfocused: true,
  });
  const { isFetching: isFetchingNotifications, refetch: refetchNotifications } =
    useGetNotificationsQuery(undefined, { pollingInterval: 30_000, skipPollingIfUnfocused: true });
  const { currentData: user, error: queryError } = useGetUserQuery(undefined, {
    pollingInterval: 5_000,
    skipPollingIfUnfocused: true,
  });

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
  }, [dispatch, enqueueSnackbar, queryError, networkErrorNotificationId, closeSnackbar]);

  // Close the list on mobile when team is selected
  useEffect(() => {
    if (!desktop && selectedId !== null) {
      setListOpen(false);
    }
  }, [desktop, selectedId]);

  // Close the list on desktop if the user doesn't have permissions to view team details
  useEffect(() => {
    if (desktop && user && !user.permissions.includes('view_team_details')) {
      setListOpen(false);
    }
  }, [user, desktop]);

  // Stop creating marker when escape is pressed
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setCreatingMarker(null);
      }
    }
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  });

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
        .filter(
          (team) => showSafe || !team.safe_weide || team.safe_weide.trim().toLowerCase() === 'bus',
        )
        .filter((team) => showBus || team.safe_weide.trim().toLowerCase() !== 'bus')
        .filter((team) => showRed || team.direction !== Direction.RED)
        .filter((team) => showBlue || team.direction !== Direction.BLUE);
    } else {
      return [];
    }
  }, [teamFuse, keyword, teams, showSafe, showBus, showRed, showBlue]);

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
      setShowNotifications(false);
    }
    setKeyword(keyword);
  }, []);

  const onForceUpdate = useCallback(() => {
    refetchMembers();
    refetchTeams();
    refetchTrackers();
    refetchNotifications();
  }, [refetchMembers, refetchTeams, refetchTrackers, refetchNotifications]);

  const onToggleMapNoteCreation = useCallback(() => {
    setCreatingMarker((value) => {
      switch (value) {
        case 'mapNote':
          return null;
        case null:
          return 'mapNote';
        default:
          return value;
      }
    });
  }, []);

  const onCreateMarker = useCallback(
    (position: LngLat) => {
      if (creatingMarker === 'mapNote') {
        setMapNoteLngLat(position);
      } else if (creatingMarker === 'tracker') {
        setTrackerLogLngLat(position);
      }
    },
    [creatingMarker],
  );

  const onStartTrackerLogCreation = useCallback(() => {
    setCreatingMarker((value) => {
      switch (value) {
        case 'tracker':
          return null;
        case null:
          return 'tracker';
        default:
          return value;
      }
    });
  }, []);

  const onMarkerComplete = useCallback(() => {
    setCreatingMarker(null);
    setMapNoteLngLat(null);
    setTrackerLogLngLat(null);
  }, []);

  const onOpenNotifications = useCallback(() => {
    if (!listOpen) {
      setListOpen(true);
      setShowNotifications(true);
    } else {
      setShowNotifications((value) => !value);
    }
  }, [listOpen]);

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
    flex: 1 1 0;
    min-height: 0;
    position: relative;
  `;

  const footer = css`
    pointer-events: auto;
    z-index: 5;
  `;

  const contentMap = css`
    width: 100%;
    height: 100%;
    position: absolute;
    pointer-events: auto;
  `;

  const contentList = css`
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    pointer-events: auto;
    z-index: 4;
    display: flex;
  `;

  // Navigate to login page if unauthenticated
  if (user && user.username === null) {
    return <Navigate to={'/login'} />;
  }

  return (
    <div
      css={css`
        height: 100%;
      `}
    >
      {desktop && (
        <MainMap
          filteredTeams={filteredTeams}
          filteredMembers={filteredMembers}
          creatingMapNote={creatingMarker === 'mapNote'}
          creatingMarker={creatingMarker !== null}
          onToggleMapNoteCreation={onToggleMapNoteCreation}
          onCreateMarker={onCreateMarker}
        />
      )}

      <div css={sidebar}>
        <Paper elevation={3} square css={header}>
          <MainToolbar
            keyword={keyword}
            onChangeKeyword={onChangeKeyword}
            onSearchEnter={onSearchEnter}
            listOpen={listOpen}
            setListOpen={setListOpen}
            isUpdating={
              isFetchingTeams || isFetchingMembers || isFetchingTrackers || isFetchingNotifications
            }
            onForceUpdate={onForceUpdate}
            onOpenNotifications={onOpenNotifications}
          />
        </Paper>
        <div css={middle}>
          {!desktop && (
            <div css={contentMap}>
              <MainMap
                filteredTeams={filteredTeams}
                filteredMembers={filteredMembers}
                creatingMapNote={creatingMarker === 'mapNote'}
                creatingMarker={creatingMarker !== null}
                onToggleMapNoteCreation={onToggleMapNoteCreation}
                onCreateMarker={onCreateMarker}
              />
            </div>
          )}
          <Paper css={contentList} sx={{ visibility: listOpen ? 'visible' : 'hidden' }} square>
            {showNotifications ? (
              <NotificationList onTrackerClick={showTracker} />
            ) : (
              <TrackerList members={filteredMembers} teams={filteredTeams} onClick={showTracker} />
            )}
          </Paper>
        </div>
        <div css={footer}>
          <BottomMenu />
        </div>
      </div>
      {selectedId !== null && !showHistory && !trackerLogLngLat && (
        <StatusCard
          onStartTrackerLogCreation={onStartTrackerLogCreation}
          isCreatingTrackerLog={creatingMarker === 'tracker'}
        />
      )}
      {selectedId !== null && showHistory && <HistoryCard />}

      <CreateMapNoteDialog position={mapNoteLngLat} onComplete={onMarkerComplete} />
      <CreateTrackerLogDialog position={trackerLogLngLat} onComplete={onMarkerComplete} />
    </div>
  );
}
