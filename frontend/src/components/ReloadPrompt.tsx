import { useEffect } from 'react';

import { Button } from '@mui/material';

import { SnackbarKey, useSnackbar } from 'notistack';
import { useRegisterSW } from 'virtual:pwa-register/react';

export default function ReloadPrompt() {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      console.log(`Service Worker at: ${swUrl}`);
      // @ts-expect-error just ignore
      if (reloadSW === 'true') {
        r &&
          setInterval(() => {
            console.log('Checking for sw update');
            r.update();
          }, 20000 /* 20s for testing purposes */);
      } else {
        console.log('SW Registered: ' + r);
      }
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  useEffect(() => {
    if (needRefresh) {
      enqueueSnackbar('Nieuwe versie beschikbaar. Klik update om te updaten.', {
        action: (snackbarId: SnackbarKey) => {
          const onClose = () => {
            setOfflineReady(false);
            setNeedRefresh(false);
            closeSnackbar(snackbarId);
          };
          return (
            <>
              <Button onClick={onClose} color="error">
                Sluiten
              </Button>
              <Button color="success" onClick={() => updateServiceWorker(true)}>
                Update
              </Button>
            </>
          );
        },
        variant: 'warning',
      });
    } else if (offlineReady) {
      enqueueSnackbar('Klaar voor offline gebruik.', { variant: 'success' });
    }
  }, [
    enqueueSnackbar,
    offlineReady,
    needRefresh,
    setOfflineReady,
    setNeedRefresh,
    closeSnackbar,
    updateServiceWorker,
  ]);

  return null;
}
