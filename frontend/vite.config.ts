import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

import manifest from './manifest.json';

const ReactCompilerConfig = { /* ... */ };

export default defineConfig(({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };
  return {
    resolve: {
      conditions: ['mui-modern', 'module', 'browser', 'development|production'],
    },
    plugins: [
      react({
        jsxImportSource: '@emotion/react',
        babel: {
          plugins: [
            ["babel-plugin-react-compiler", ReactCompilerConfig]
          ]
        }
      }),
      VitePWA({
        manifest,
        injectRegister: 'auto',
        pwaAssets: {
          overrideManifestIcons: true,
        },
        workbox: {
          navigateFallbackAllowlist: [/^\/$/, /^\/team\/\d+\/?$/, /^\/login\/?$/, /^\/tracing\/?$/],
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/link\d?(?:-test)?.tijsb.be\/api\/user/,
              handler: 'NetworkOnly',
            },
            {
              urlPattern: /^https:\/\/link\d?(?:-test)?.tijsb.be\/api\/(?:tochten|fiches|weides|basis|zijwegen|forbidden-areas)/,
              handler: 'StaleWhileRevalidate',
            },
            {
              urlPattern: /^https:\/\/link\d?(?:-test)?.tijsb.be\/api\//,
              handler: 'NetworkFirst',
            },
            {
              urlPattern: /^https:\/\/link\d?(?:-test)?.tijsb.be\/tiles\/belgium\.pmtiles/,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheableResponse: {
                  statuses: [0, 200, 204, 206],
                },
                rangeRequests: true,
              },
            },
            {
              urlPattern: /^https:\/\/link\d?(?:-test)?.tijsb.be\/tiles\/fonts\//,
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
      },
    },
  };
});
