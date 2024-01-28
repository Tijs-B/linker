import { ThemeProvider } from '@mui/material';
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  dimensions: {
    drawerWidthDesktop: '360px',
    popupMaxWidth: '360px',
  },
});

export default function AppThemeProvider({ children }) {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
