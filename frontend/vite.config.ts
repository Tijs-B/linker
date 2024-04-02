import react from '@vitejs/plugin-react-swc';
import { defineConfig, loadEnv } from 'vite';
// import { VitePWA } from 'vite-plugin-pwa';

// import manifest from './manifest.json';

export default defineConfig(({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };
  return {
    base: mode === 'production' ? '/static/' : '/',
    plugins: [
      react({
        jsxImportSource: '@emotion/react',
      }),
      // VitePWA({
      //   manifest,
      //   injectRegister: 'auto',
      //   devOptions: {
      //     enabled: true,
      //   },
      //   pwaAssets: {
      //     overrideManifestIcons: true,
      //   },
      //   workbox: {
      //     globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      //   },
      // }),
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
