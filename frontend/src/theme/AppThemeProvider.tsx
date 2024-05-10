import { ReactNode, memo } from 'react';

import { ThemeProvider } from '@mui/material';
import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Theme {
    dimensions: {
      drawerWidthDesktop: string;
      popupMaxWidth: string;
    };
  }

  interface ThemeOptions {
    dimensions?: {
      drawerWidthDesktop?: string;
      popupMaxWidth?: string;
    };
  }
}

const theme = createTheme({
  dimensions: {
    drawerWidthDesktop: '360px',
    popupMaxWidth: '360px',
  },
});

const AppThemeProvider = memo(function AppThemeProvider({ children }: { children: ReactNode }) {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
});

export default AppThemeProvider;
