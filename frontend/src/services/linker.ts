import { createEntityAdapter } from '@reduxjs/toolkit';
import type { EntityState } from '@reduxjs/toolkit';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { LineString, Point } from 'geojson';

import { getCookie } from '../utils/cookie';
import {
  Basis,
  CheckpointLog,
  ContactPerson,
  Fiche,
  ForbiddenArea,
  LoginUser,
  MapNote,
  OrganizationMember,
  Stats,
  Team,
  TeamNote,
  Tocht,
  Tracker,
  TrackerLog,
  Weide,
  Zijweg,
} from './types';

const trackerAdapter = createEntityAdapter<Tracker>();
const teamAdapter = createEntityAdapter<Team>();
const organizationMemberAdapter = createEntityAdapter<OrganizationMember>();
const tochtAdapter = createEntityAdapter<Tocht>();
const ficheAdapter = createEntityAdapter<Fiche>();
const checkpointLogAdapter = createEntityAdapter<CheckpointLog>();
const mapNoteAdapter = createEntityAdapter<MapNote>();
const zijwegenAdapter = createEntityAdapter<Zijweg>();
const weidesAdapter = createEntityAdapter<Weide>();

export const linkerApi = createApi({
  reducerPath: 'linkerApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/',
    prepareHeaders: (headers, { type }) => {
      if (type === 'mutation') {
        const csrf = getCookie('csrftoken');
        if (csrf) {
          headers.set('X-CSRFToken', csrf);
        }
      }
      return headers;
    },
  }),
  refetchOnFocus: true,
  refetchOnReconnect: true,
  tagTypes: ['Team', 'MapNote'],
  endpoints: (build) => ({
    getTrackers: build.query<EntityState<Tracker, number>, void>({
      query: () => '/trackers/',
      transformResponse(response: Tracker[]) {
        return trackerAdapter.addMany(trackerAdapter.getInitialState(), response);
      },
    }),
    getTeams: build.query<EntityState<Team, number>, void>({
      query: () => '/teams/',
      transformResponse(response: Team[]) {
        return teamAdapter.addMany(teamAdapter.getInitialState(), response);
      },
      providesTags: ['Team'],
    }),
    getOrganizationMembers: build.query<EntityState<OrganizationMember, number>, void>({
      query: () => '/organization-members/',
      transformResponse(response: OrganizationMember[]) {
        return organizationMemberAdapter.addMany(
          organizationMemberAdapter.getInitialState(),
          response,
        );
      },
    }),
    getTochten: build.query<EntityState<Tocht, number>, void>({
      query: () => '/tochten/',
      transformResponse(response: Tocht[]) {
        return tochtAdapter.addMany(tochtAdapter.getInitialState(), response);
      },
    }),
    getFiches: build.query<EntityState<Fiche, number>, void>({
      query: () => '/fiches/',
      transformResponse(response: Fiche[]) {
        return ficheAdapter.addMany(ficheAdapter.getInitialState(), response);
      },
    }),
    getCheckpointLogs: build.query<EntityState<CheckpointLog, number>, void>({
      query: () => '/checkpoint-logs/',
      transformResponse(response: CheckpointLog[]) {
        return checkpointLogAdapter.addMany(checkpointLogAdapter.getInitialState(), response);
      },
    }),
    getMapNotes: build.query<EntityState<MapNote, number>, void>({
      query: () => '/map-notes/',
      transformResponse(response: MapNote[]) {
        return mapNoteAdapter.addMany(mapNoteAdapter.getInitialState(), response);
      },
      providesTags: ['MapNote'],
    }),
    getZijwegen: build.query<EntityState<Zijweg, number>, void>({
      query: () => '/zijwegen/',
      transformResponse(response: Zijweg[]) {
        return zijwegenAdapter.addMany(zijwegenAdapter.getInitialState(), response);
      },
    }),
    getWeides: build.query<EntityState<Weide, number>, void>({
      query: () => '/weides/',
      transformResponse(response: Weide[]) {
        return weidesAdapter.addMany(weidesAdapter.getInitialState(), response);
      },
    }),
    getTrackerLogs: build.query<TrackerLog[], number>({
      query: (id) => `/trackers/${id}/logs/`,
    }),
    getTrackerTrack: build.query<LineString, number>({
      query: (id) => `/trackers/${id}/track/`,
    }),
    getBasis: build.query<Point, void>({
      query: () => '/basis/',
      transformResponse(response: Basis[]) {
        return response[0].point;
      },
    }),
    updateContactPerson: build.mutation<
      ContactPerson,
      Partial<ContactPerson> & Pick<ContactPerson, 'id'>
    >({
      query: (contactPerson) => ({
        url: `/contact-persons/${contactPerson.id}/`,
        method: 'PATCH',
        body: contactPerson,
      }),
      invalidatesTags: ['Team'],
    }),
    getStats: build.query<Stats, void>({
      query: () => '/stats/',
    }),
    loginUser: build.mutation<void, LoginUser>({
      query: (body) => ({
        url: `/login/`,
        method: 'POST',
        body,
      }),
    }),
    getForbiddenAreas: build.query<ForbiddenArea[], void>({
      query: () => '/forbidden-areas/',
    }),
    updateTeam: build.mutation<Team, Partial<Team> & Pick<Team, 'id'>>({
      query: (team) => ({
        url: `/teams/${team.id}/`,
        method: 'PATCH',
        body: team,
      }),
      invalidatesTags: ['Team'],
    }),
    deleteTeamNote: build.mutation<void, number>({
      query: (noteId) => ({
        url: `/team-notes/${noteId}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Team'],
    }),
    createTeamNote: build.mutation<TeamNote, Omit<TeamNote, 'id' | 'created'>>({
      query: (note) => ({
        url: '/team-notes/',
        method: 'POST',
        body: note,
      }),
      invalidatesTags: ['Team'],
    }),
    createMapNote: build.mutation<MapNote, Omit<MapNote, 'id' | 'created' | 'updated'>>({
      query: (mapNote) => ({
        url: '/map-notes/',
        method: 'POST',
        body: mapNote,
      }),
      invalidatesTags: ['MapNote'],
    }),
  }),
});

export const {
  useGetTrackersQuery,
  useGetTeamsQuery,
  useGetTochtenQuery,
  useGetFichesQuery,
  useGetOrganizationMembersQuery,
  useGetCheckpointLogsQuery,
  useGetMapNotesQuery,
  useGetZijwegenQuery,
  useGetTrackerLogsQuery,
  useGetTrackerTrackQuery,
  useGetBasisQuery,
  useGetWeidesQuery,
  useUpdateContactPersonMutation,
  useLoginUserMutation,
  useGetStatsQuery,
  useGetForbiddenAreasQuery,
  useUpdateTeamMutation,
  useDeleteTeamNoteMutation,
  useCreateTeamNoteMutation,
  useCreateMapNoteMutation,
} = linkerApi;