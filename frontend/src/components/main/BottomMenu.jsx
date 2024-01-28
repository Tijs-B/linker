import { useLocation, useNavigate } from "react-router-dom";
import { BottomNavigation, BottomNavigationAction, Paper } from "@mui/material";
import MapIcon from '@mui/icons-material/Map';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';

export default function BottomMenu() {
  const location = useLocation();
  const navigate = useNavigate();

  const currentSelection = function() {
    if (location.pathname === '/') {
      return 'map';
    }
    return null;
  }

  return (
    <Paper square elevation={3}>
      <BottomNavigation value={currentSelection()} showLabels >
        <BottomNavigationAction label="Kaart" icon={<MapIcon />} value="map" onClick={() => navigate('/')} />
        <BottomNavigationAction label="Tracing" icon={<FormatListNumberedIcon />} value="tracing" onClick={() => navigate('/tracing/')}/>
      </BottomNavigation>
    </Paper>
  )
}
