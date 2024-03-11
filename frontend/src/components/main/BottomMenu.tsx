import { memo } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';

import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import MapIcon from '@mui/icons-material/Map';
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';

const BottomMenu = memo(function BottomMenu() {
  const location = useLocation();

  const currentSelection = function (): string | null {
    if (location.pathname === '/') {
      return 'map';
    } else if (location.pathname === '/tracing/') {
      return 'tracing';
    }
    return null;
  };

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
      </BottomNavigation>
    </Paper>
  );
});

export default BottomMenu;
