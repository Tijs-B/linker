import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react";
import {createEntityAdapter} from "@reduxjs/toolkit";

const trackerAdapter = createEntityAdapter();
const teamAdapter = createEntityAdapter();
const organizationMemberAdapter = createEntityAdapter();
const tochtAdapter = createEntityAdapter();
const ficheAdapter = createEntityAdapter();
const checkpointLogAdapter = createEntityAdapter();
const mapNoteAdapter = createEntityAdapter();
const zijwegenAdapter = createEntityAdapter();

export const linkerApi = createApi({
    reducerPath: 'linkerApi',
    baseQuery: fetchBaseQuery({baseUrl: '/api/'}),
    refetchOnFocus: true,
    refetchOnReconnect: true,
    endpoints: (build) => ({
        getTrackers: build.query({
            query: () => '/trackers/',
            transformResponse(response) {
                return trackerAdapter.addMany(trackerAdapter.getInitialState(), response);
            }
        }),
        getTeams: build.query({
            query: () => '/teams/',
            transformResponse(response) {
                return teamAdapter.addMany(teamAdapter.getInitialState(), response);
            }
        }),
        getOrganizationMembers: build.query({
            query: () => '/organization-members/',
            transformResponse(response) {
                return organizationMemberAdapter.addMany(organizationMemberAdapter.getInitialState(), response);
            }
        }),
        getTochten: build.query({
            query: () => '/tochten/',
            transformResponse(response) {
                return tochtAdapter.addMany(tochtAdapter.getInitialState(), response);
            }
        }),
        getFiches: build.query({
            query: () => '/fiches/',
            transformResponse(response) {
                return ficheAdapter.addMany(ficheAdapter.getInitialState(), response);
            }
        }),
        getCheckpointLogs: build.query({
            query: () => '/checkpoint-logs/',
            transformResponse(response) {
                return checkpointLogAdapter.addMany(checkpointLogAdapter.getInitialState(), response);
            }
        }),
        getMapNotes: build.query({
            query: () => '/map-notes/',
            transformResponse(response) {
                return mapNoteAdapter.addMany(mapNoteAdapter.getInitialState(), response);
            }
        }),
        getZijwegen: build.query({
            query: () => '/zijwegen/',
            transformResponse(response) {
                return zijwegenAdapter.addMany(zijwegenAdapter.getInitialState(), response);
            }
        }),
        getTrackerLogs: build.query({
            query: (id) => `/trackers/${id}/logs/`,
        }),
        getTrackerTrack: build.query({
            query: (id) => `/trackers/${id}/track/`,
        }),
    })
})

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
} = linkerApi;