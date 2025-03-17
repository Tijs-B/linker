import { useCallback } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';

import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import LogoutIcon from '@mui/icons-material/Logout';
import MapIcon from '@mui/icons-material/Map';
import SettingsIcon from '@mui/icons-material/Settings';
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';

import { useGetUserQuery, useLogoutUserMutation } from '../../services/linker.ts';

export default function BottomMenu() {
  const location = useLocation();
  const navigate = useNavigate();
  const logoutUser = useLogoutUserMutation()[0];
  const { data: user } = useGetUserQuery();

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
    navigate('/login/');
  }, [navigate, logoutUser]);

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
        {user?.is_staff && (
          <BottomNavigationAction
            label="Admin"
            icon={<SettingsIcon />}
            value="admin"
            href="/admin/"
          />
        )}
        <BottomNavigationAction
          label="Logout"
          icon={<LogoutIcon />}
          value="logout"
          onClick={onLogout}
        />
      </BottomNavigation>
    </Paper>
  );
}
