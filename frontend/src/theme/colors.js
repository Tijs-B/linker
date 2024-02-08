import { blue, green, indigo, lightGreen, orange, purple, red } from '@mui/material/colors';

export function teamColor(team) {
  return team.direction === 'R' ? red[500] : blue[500];
}

export function memberColor(member) {
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
  }
}

export function itemColor(item) {
  if ('member_type' in item) {
    return memberColor(item);
  } else {
    return teamColor(item);
  }
}
