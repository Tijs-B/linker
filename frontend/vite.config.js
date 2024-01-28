import react from '@vitejs/plugin-react-swc';
import {defineConfig, loadEnv} from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({mode}) => {
    return {
        base: (mode === 'production' ? '/static/' : '/'),
        plugins: [
            react({
                jsxImportSource: '@emotion/react',
                babel: {
                    plugins: ['@emotion/babel-plugin'],
                },
            }),
        ],
        server: {
            proxy: {
                '/api': {
                    target: process.env.BACKEND_URL,
                    changeOrigin: true,
                },
            },
        },
    }
});
