import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react";
import {createEntityAdapter} from "@reduxjs/toolkit";
import {getCookie} from "../utils/cookie.js";

const trackerAdapter = createEntityAdapter();
const teamAdapter = createEntityAdapter();
const organizationMemberAdapter = createEntityAdapter();
const tochtAdapter = createEntityAdapter();
const ficheAdapter = createEntityAdapter();
const checkpointLogAdapter = createEntityAdapter();
const mapNoteAdapter = createEntityAdapter();
const zijwegenAdapter = createEntityAdapter();
const weidesAdapter = createEntityAdapter();

export const linkerApi = createApi({
    reducerPath: 'linkerApi',
    baseQuery: fetchBaseQuery({
        baseUrl: '/api/',
        prepareHeaders: (headers, {type}) => {
            if (type === 'mutation') {
                const csrf = getCookie('csrftoken');
                headers.set('X-CSRFToken', csrf);
            }
            return headers;
        }
    }),
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
            },
            providesTags: (result) => result ?
                [
                    ...result.ids.map((id) => ({type: 'Team', id})),
                    {type: 'Team', id: 'LIST'},
                ]
                :
                [{type: 'Team', id: 'LIST'}]
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
        getWeides: build.query({
            query: () => '/weides/',
            transformResponse(response) {
                return weidesAdapter.addMany(weidesAdapter.getInitialState(), response);
            }
        }),
        getTrackerLogs: build.query({
            query: (id) => `/trackers/${id}/logs/`,
        }),
        getTrackerTrack: build.query({
            query: (id) => `/trackers/${id}/track/`,
        }),
        getBasis: build.query({
            query: () => '/basis/',
            transformResponse(response) {
                return response[0].point;
            }
        }),
        updateContactPerson: build.mutation({
            query: contactPerson => ({
                url: `/contact-persons/${contactPerson.id}/`,
                method: 'PATCH',
                body: contactPerson,
            }),
            invalidatesTags: (result, error, { team }) => [{type: 'Team', id: team}]
        }),
        getStats: build.query({
            query: () => '/stats/',
        }),
        loginUser: build.mutation({
            query: (body) => ({
                url: `/login/`,
                method: 'POST',
                body,
            }),
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
    useGetBasisQuery,
    useGetWeidesQuery,
    useUpdateContactPersonMutation,
    useLoginUserMutation,
    useGetStatsQuery,
} = linkerApi;