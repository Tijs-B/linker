import { Avatar, Box, CircularProgress, SxProps, Theme } from '@mui/material';
import { green, orange, red } from '@mui/material/colors';

import { OrganizationMember, Team } from '../services/types.ts';
import { itemColor } from '../theme/colors.ts';

interface PersonAvatarProps {
  item: OrganizationMember | Team | undefined | null;
  batteryPercentage?: number | null;
  sx?: SxProps<Theme>;
}

function batteryColor(percentage: number | null) {
  if (!percentage || percentage < 15) {
    return red[500];
  } else if (percentage < 30) {
    return orange[500];
  } else {
    return green[500];
  }
}

export default function PersonAvatar({
  item,
  batteryPercentage = null,
  sx = [],
}: PersonAvatarProps) {
  if (!item) {
    return null;
  }
  const width = sx && 'width' in sx && typeof sx.width === 'number' ? sx.width : 40;
  const fontSize = item.code.length > 2 ? width * 0.6 * 0.7 : width * 0.6;
  return (
    <Box sx={{ position: 'relative' }}>
      <Avatar sx={[{ bgcolor: itemColor(item), fontSize }, ...(Array.isArray(sx) ? sx : [sx])]}>
        {item.code}
      </Avatar>
      {batteryPercentage !== null && (
        <CircularProgress
          size={width + 12}
          sx={{
            color: batteryColor(batteryPercentage),
            position: 'absolute',
            top: -6,
            left: -6,
            zIndex: 1,
          }}
          variant="determinate"
          value={batteryPercentage}
        />
      )}
    </Box>
  );
}
