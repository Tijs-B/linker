import { Avatar } from '@mui/material';

import { OrganizationMember, Team } from '../services/types.ts';
import { itemColor } from '../theme/colors.ts';

interface PersonAvatarProps {
  item: OrganizationMember | Team | undefined;
  width?: number;
}

export default function PersonAvatar({ item, width = 40 }: PersonAvatarProps) {
  if (!item) {
    return null;
  }
  const code = 'code' in item ? item.code : item.number.toString().padStart(2, '0');
  const bgcolor = itemColor(item);
  const baseFontSize = width ? width * 0.6 : 20;
  const fontSize = code.length > 2 ? baseFontSize * 0.8 : baseFontSize;
  // noinspection JSSuspiciousNameCombination
  return <Avatar sx={{ bgcolor, fontSize, width, height: width }}>{code}</Avatar>;
}
