import { Avatar } from '@mui/material';
import { yellow } from '@mui/material/colors';

import { OrganizationMember, Team } from '../services/types.ts';
import { itemColor } from '../theme/colors.ts';

interface PersonAvatarProps {
  item: OrganizationMember | Team | undefined | null;
  isOnline: boolean;
  width?: number;
}

export default function PersonAvatar({ item, isOnline, width = 40 }: PersonAvatarProps) {
  if (!item) {
    return null;
  }
  const bgcolor = itemColor(item);
  const baseFontSize = width ? width * 0.6 : 20;
  const fontSize = item.code.length > 2 ? baseFontSize * 0.7 : baseFontSize;
  // noinspection JSSuspiciousNameCombination
  return (
    <Avatar
      sx={{
        bgcolor,
        fontSize,
        width,
        height: width,
        border: isOnline ? 0 : 3,
        borderColor: yellow[700],
      }}
    >
      {item.code}
    </Avatar>
  );
}
