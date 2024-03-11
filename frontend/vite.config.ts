import react from '@vitejs/plugin-react-swc';
import { defineConfig, loadEnv } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // @ts-expect-error I have no idea
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };
  return {
    base: mode === 'production' ? '/static/' : '/',
    plugins: [
      react({
        jsxImportSource: '@emotion/react',
      }),
    ],
    server: {
      proxy: {
        '/api': {
          // @ts-expect-error I have no idea
          target: process.env.VITE_BACKEND_URL,
          changeOrigin: true,
        },
      },
    },
  };
});
