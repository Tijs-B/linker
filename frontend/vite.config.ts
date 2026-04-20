import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

import manifest from './manifest.json';

const ReactCompilerConfig = {
  /* ... */
};

export default defineConfig(({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };
  const domain = process.env.VITE_DOMAIN ?? 'link.tijsb.be';
  const escapedDomain = domain.replace(/\./g, '\\.');
  return {
    resolve: {
      conditions: ['mui-modern', 'module', 'browser', 'development|production'],
    },
    plugins: [
      react({
        jsxImportSource: '@emotion/react',
        babel: {
          plugins: [['babel-plugin-react-compiler', ReactCompilerConfig]],
        },
      }),
      VitePWA({
        manifest,
        injectRegister: 'auto',
        registerType: 'autoUpdate',
        pwaAssets: {
          overrideManifestIcons: true,
        },
        workbox: {
          navigateFallbackAllowlist: [/^\/$/, /^\/team\/\d+\/?$/, /^\/login\/?$/, /^\/tracing\/?$/],
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          runtimeCaching: [
            {
              urlPattern: new RegExp(`^https://${escapedDomain}/api/user`),
              handler: 'NetworkOnly',
            },
            {
              urlPattern: new RegExp(
                `^https://${escapedDomain}/api/(?:tochten|fiches|weides|basis|zijwegen|forbidden-areas)`,
              ),
              handler: 'StaleWhileRevalidate',
              options: {
                expiration: { maxAgeSeconds: 4 * 60 * 60 },
                cacheName: 'linker-map-data-2025',
              },
            },
            {
              urlPattern: new RegExp(`^https://${escapedDomain}/api/`),
              handler: 'NetworkFirst',
              options: {
                expiration: { maxAgeSeconds: 2 * 60 * 60 },
                cacheName: 'linker-api-data-2025',
              },
            },
            {
              urlPattern: new RegExp(`^https://${escapedDomain}/tiles/openmaptiles,outdoor/`),
              handler: 'CacheFirst',
              options: {
                cacheableResponse: {
                  statuses: [0, 200, 204],
                },
              },
            },
            {
              urlPattern: new RegExp(`^https://${escapedDomain}/tiles/font/`),
              handler: 'CacheFirst',
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
        '/tiles': {
          target: process.env.VITE_TILES_URL,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/tiles/, ''),
        }
      },
    },
  };
});
