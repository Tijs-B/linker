import { memo, useCallback } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';

import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import LogoutIcon from '@mui/icons-material/Logout';
import MapIcon from '@mui/icons-material/Map';
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';

import { useLogoutUserMutation } from '../../services/linker.ts';

const BottomMenu = memo(function BottomMenu() {
  const location = useLocation();

  const logoutUser = useLogoutUserMutation()[0];

  const currentSelection = function (): string | null {
    if (location.pathname === '/') {
      return 'map';
    } else if (location.pathname === '/tracing/') {
      return 'tracing';
    }
    return null;
  };

  const onLogout = useCallback(() => {
    logoutUser();
  }, [logoutUser]);

  return (
    <Paper square elevation={3}>
      <BottomNavigation value={currentSelection()} showLabels>
        <BottomNavigationAction
          label="Kaart"
          icon={<MapIcon />}
          value="map"
          component={RouterLink}
          to="/"
        />
        <BottomNavigationAction
          label="Tracing"
          icon={<FormatListNumberedIcon />}
          value="tracing"
          component={RouterLink}
          to="/tracing/"
        />
        <BottomNavigationAction
          label="Logout"
          icon={<LogoutIcon />}
          value="logout"
          onClick={onLogout}
        />
      </BottomNavigation>
    </Paper>
  );
});

export default BottomMenu;
