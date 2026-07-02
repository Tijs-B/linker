import { useRegisterSW } from 'virtual:pwa-register/react';

export default function RegisterServiceWorker() {
  useRegisterSW({
    immediate: true,
    onRegisteredSW(_swUrl, r) {
      if (r) {
        setInterval(() => {
          r.update();
        }, 1000 * 60);
      }
    },
    onRegisterError(error) {
      console.error('SW registration error', error);
    },
  });

  return null;
}
