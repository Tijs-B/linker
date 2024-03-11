import { blue, green, indigo, lightGreen, orange, purple, red } from '@mui/material/colors';

import { Direction, OrganizationMember, Team } from '../services/types.ts';

export function teamColor(team: Team): string {
  return team.direction === Direction.RED ? red[500] : blue[500];
}

export function memberColor(member: OrganizationMember): string | null {
  switch (member.member_type) {
    case 'Agenda':
      return green[500];
    case 'Coordinatie':
      return lightGreen[500];
    case 'Rode Kruis':
      return orange[500];
    case 'Handige Harry':
      return purple[500];
    case 'Weide':
      return indigo[500];
    default:
      console.error(`Unexpected organization member type ${member.member_type}`);
      return null;
  }
}

export function itemColor(item: Team | OrganizationMember): string | null {
  if ('member_type' in item) {
    return memberColor(item);
  } else {
    return teamColor(item);
  }
}
