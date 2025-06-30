import type { ReactNode } from 'react';

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
  palette: {
    primary: {
      main: '#689f38',
    },
    secondary: {
      main: '#ffc400',
    },
  },
  dimensions: {
    drawerWidthDesktop: '360px',
    popupMaxWidth: '360px',
  },
});

export default function AppThemeProvider({ children }: { children: ReactNode }) {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
