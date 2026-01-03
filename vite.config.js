import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  // Optional dev-only proxy target for local API (e.g. http://127.0.0.1:5000),
  // configured via VITE_DEV_API_PROXY_TARGET to avoid hardcoding any host here.
  const devProxyTarget = env.VITE_DEV_API_PROXY_TARGET || '';

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: devProxyTarget
        ? {
            '/api': {
              target: devProxyTarget,
              changeOrigin: true,
            },
          }
        : undefined,
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
      extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json']
    }
  };
});

