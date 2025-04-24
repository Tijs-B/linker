import { useRegisterSW } from 'virtual:pwa-register/react';

export default function RegisterServiceWorker() {
  useRegisterSW({
    immediate: true,
    onRegisteredSW(swUrl, r) {
      console.log(`Service Worker at ${swUrl}`);
      console.log('Registration:', r);
      if (r) {
        setInterval(() => {
          console.log('Checking for sw update');
          r.update();
        }, 1000 * 20 /* 20s for testing purposes */);
      }
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  return null;
}
