import { Avatar, SxProps, Theme } from '@mui/material';
import { yellow } from '@mui/material/colors';

import { OrganizationMember, Team } from '../services/types.ts';
import { itemColor } from '../theme/colors.ts';

interface PersonAvatarProps {
  item: OrganizationMember | Team | undefined | null;
  isOnline?: boolean;
  sx?: SxProps<Theme>;
}

export default function PersonAvatar({ item, isOnline = true, sx = [] }: PersonAvatarProps) {
  if (!item) {
    return null;
  }
  const bgcolor = itemColor(item);
  const width = sx && 'width' in sx && typeof sx.width === 'number' ? sx.width : 40;
  const fontSize = item.code.length > 2 ? width * 0.6 * 0.7 : width * 0.6;
  return (
    <Avatar
      sx={[
        {
          bgcolor,
          fontSize,
          border: isOnline ? 0 : width * 0.09,
          borderColor: yellow[700],
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {item.code}
    </Avatar>
  );
}
