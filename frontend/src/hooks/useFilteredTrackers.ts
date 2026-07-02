import { useMemo } from 'react';

import Fuse from 'fuse.js';

import {
  useGetOrganizationMembersQuery,
  useGetTeamsQuery,
  useGetWeidesQuery,
} from '../services/linker.ts';
import type { OrganizationMember, Team } from '../services/types.ts';
import { selectWeideSlotweide, useAppSelector } from '../store';
import { getTeamSafetyState, isTeamVisible } from '../utils/teamSafety.ts';

interface FilteredTrackers {
  filteredTeams: Team[];
  filteredMembers: OrganizationMember[];
  // The Fuse indexes are exposed so callers can run their own searches (e.g.
  // "jump to best match on enter") without rebuilding them.
  teamFuse: Fuse<Team> | undefined;
  memberFuse: Fuse<OrganizationMember> | undefined;
}

// Applies the active view/filters and the search keyword to the teams and
// organisatie members. Keeps this (non-trivial) domain logic out of the page
// component and reuses the shared safety-state rules.
export function useFilteredTrackers(keyword: string): FilteredTrackers {
  const { data: teams } = useGetTeamsQuery();
  const { data: organizationMembers } = useGetOrganizationMembersQuery();
  // Subscribe so the weides are fetched; the derived map comes from the selector.
  useGetWeidesQuery();

  const weideSlotweide = useAppSelector(selectWeideSlotweide);
  const filters = useAppSelector((state) => state.filter);
  const showMembers = filters.showMembers;

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

  const filteredTeams = useMemo<Team[]>(() => {
    if (teamFuse && keyword) {
      return teamFuse.search(keyword).map((item) => item.item);
    } else if (teams) {
      return teams.ids
        .map((id) => teams.entities[id])
        .filter((team) => isTeamVisible(getTeamSafetyState(team, weideSlotweide), filters));
    } else {
      return [];
    }
  }, [teamFuse, keyword, teams, weideSlotweide, filters]);

  const filteredMembers = useMemo<OrganizationMember[]>(() => {
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

  return { filteredTeams, filteredMembers, teamFuse, memberFuse };
}
