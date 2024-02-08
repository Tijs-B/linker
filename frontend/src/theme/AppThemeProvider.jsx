import { ThemeProvider } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import {memo} from "react";

const theme = createTheme({
  dimensions: {
    drawerWidthDesktop: '360px',
    popupMaxWidth: '360px',
  },
});

export default memo(function AppThemeProvider({ children }) {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
})
