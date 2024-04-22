import { createEntityAdapter } from '@reduxjs/toolkit';
import type { EntityState } from '@reduxjs/toolkit';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { feature, featureCollection } from '@turf/helpers';
import { FeatureCollection, LineString, MultiPolygon, Point } from 'geojson';

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
  User,
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
  refetchOnMountOrArgChange: 30,
  tagTypes: ['Team', 'MapNote', 'User'],
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
    getZijwegen: build.query<FeatureCollection<LineString>, void>({
      query: () => '/zijwegen/',
      transformResponse(response: Zijweg[]) {
        return featureCollection(
          response.map((zijweg) => feature(zijweg.geom, {}, { id: zijweg.id })),
        );
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
      transformResponse(response: TrackerLog[]) {
        return response.filter((log) => !log.team_is_safe);
      },
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
    getStats: build.query<Stats, void>({
      query: () => '/stats/',
    }),
    getForbiddenAreas: build.query<FeatureCollection<MultiPolygon>, void>({
      query: () => '/forbidden-areas/',
      transformResponse(response: ForbiddenArea[]) {
        return featureCollection(response.map((area) => feature(area.area, {}, { id: area.id })));
      },
    }),
    getUser: build.query<User, void>({
      query: () => '/user/',
      providesTags: ['User'],
    }),
    loginUser: build.mutation<void, LoginUser>({
      query: (body) => ({
        url: `/login/`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User'],
    }),
    logoutUser: build.mutation<void, void>({
      query: () => ({
        url: '/logout/',
        method: 'POST',
      }),
    }),
    createTeamNote: build.mutation<TeamNote, Omit<TeamNote, 'id' | 'created' | 'author'>>({
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
    deleteTeamNote: build.mutation<void, number>({
      query: (noteId) => ({
        url: `/team-notes/${noteId}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Team'],
    }),
    deleteMapNote: build.mutation<void, number>({
      query: (noteId) => ({
        url: `/map-notes/${noteId}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['MapNote'],
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
    updateTeam: build.mutation<Team, Partial<Team> & Pick<Team, 'id'>>({
      query: (team) => ({
        url: `/teams/${team.id}/`,
        method: 'PATCH',
        body: team,
      }),
      invalidatesTags: ['Team'],
    }),
    updateMapNote: build.mutation<MapNote, Partial<MapNote> & Pick<MapNote, 'id'>>({
      query: (mapNote) => ({
        url: `/map-notes/${mapNote.id}/`,
        method: 'PATCH',
        body: mapNote,
      }),
      invalidatesTags: ['MapNote'],
    }),
    uploadGroupPicture: build.mutation<void, { id: number; data: FormData }>({
      query: ({ id, data }) => ({
        url: `/teams/${id}/group-picture/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Team'],
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
  useGetStatsQuery,
  useGetForbiddenAreasQuery,
  useGetUserQuery,
  useLoginUserMutation,
  useLogoutUserMutation,
  useCreateTeamNoteMutation,
  useCreateMapNoteMutation,
  useDeleteTeamNoteMutation,
  useDeleteMapNoteMutation,
  useUpdateMapNoteMutation,
  useUpdateTeamMutation,
  useUpdateContactPersonMutation,
  useUploadGroupPictureMutation,
} = linkerApi;
