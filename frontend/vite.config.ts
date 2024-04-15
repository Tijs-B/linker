import react from '@vitejs/plugin-react-swc';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

import manifest from './manifest.json';

export default defineConfig(({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };
  return {
    plugins: [
      react({
        jsxImportSource: '@emotion/react',
      }),
      VitePWA({
        manifest,
        injectRegister: 'auto',
        pwaAssets: {
          overrideManifestIcons: true,
        },
        workbox: {
          navigateFallbackDenylist: [/^\/static/, /^\/admin/],
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/link.tijsb.be\/api\/user/,
              handler: 'NetworkOnly',
            },
            {
              urlPattern: /^https:\/\/link.tijsb.be\/api\/(?:tochten|fiches|weides|basis|zijwegen)/,
              handler: 'StaleWhileRevalidate',
            },
            {
              urlPattern: /^https:\/\/link.tijsb.be\/api\//,
              handler: 'NetworkFirst',
            },
            {
              urlPattern: /^https:\/\/tiles.tijsb.be/,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheableResponse: {
                  statuses: [0, 200, 204],
                },
              },
            },
            {
              urlPattern: /^https:\/\/maputnik.github.io/,
              handler: 'CacheFirst',
            },
          ],
        },
      }),
    ],
    server: {
      proxy: {
        '/api': {
          target: process.env.VITE_BACKEND_URL,
          changeOrigin: true,
        },
      },
    },
  };
});
