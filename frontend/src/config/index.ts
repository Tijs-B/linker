import isMobile from 'is-mobile';
import { SnackbarProviderProps } from 'notistack';

const notifications: SnackbarProviderProps = {
  anchorOrigin: {
    vertical: 'bottom',
    horizontal: 'right',
  },
  autoHideDuration: 6000,
  maxSnack: isMobile() ? 3 : 4,
};

export { notifications };
