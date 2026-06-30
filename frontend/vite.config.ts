import { readFileSync } from 'node:fs';
import { resolve } from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { optimize } from 'svgo';

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
      {
        name: 'svgo-raw',
        load(id) {
          if (!id.endsWith('.svg?raw')) return;
          const src = readFileSync(id.slice(0, -4), 'utf8');
          const result = optimize(src, {
            plugins: [{ name: 'preset-default', params: { overrides: { cleanupIds: false } } }],
          });
          return `export default ${JSON.stringify(result.data)}`;
        },
      },
      {
        name: 'tracker-dev-rewrite',
        configureServer(server) {
          server.middlewares.use((req, _res, next) => {
            if (req.url?.startsWith('/tracker')) req.url = '/tracker.html';
            next();
          });
        },
      },
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
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          tracker: resolve(__dirname, 'tracker.html'),
        },
      },
    },
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
