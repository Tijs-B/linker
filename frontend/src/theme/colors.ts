import { blue, brown, green, indigo, lightGreen, orange, purple, red } from '@mui/material/colors';

import type { OrganizationMember, Team } from '../services/types.ts';
import { Direction, MemberType } from '../services/types.ts';

export function teamColor(team: Team): string {
  return team.direction === Direction.RED ? red[500] : blue[500];
}

export function memberColor(member: OrganizationMember): string | null {
  switch (member.member_type) {
    case MemberType.AGENDA:
      return green[500];
    case MemberType.COORDINATIE:
      return lightGreen[500];
    case MemberType.RODE_KRUIS:
      return orange[500];
    case MemberType.HANDIGE_HARRY:
      return purple[500];
    case MemberType.WEIDE:
      return indigo[500];
    case MemberType.BUS:
      return brown[500];
    case MemberType.BASISBITCH:
      return '#ff6ec7';
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
