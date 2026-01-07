import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

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
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: null,
        includeAssets: ['favicon.ico', 'logo.png', 'tab.png', 'pwa-192x192.jpeg', 'pwa-512x512.jpeg'],
        manifest: {
          name: 'LahoreLink Logistics',
          short_name: 'LahoreLink Logistics',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          background_color: '#ffffff',
          theme_color: '#0B6D45',
          icons: [
            {
              src: '/pwa-192x192.jpeg',
              sizes: '192x192',
              type: 'image/jpeg'
            },
            {
              src: '/pwa-512x512.jpeg',
              sizes: '512x512',
              type: 'image/jpeg'
            },
            {
              src: '/pwa-512x512.jpeg',
              sizes: '512x512',
              type: 'image/jpeg',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,jpeg}'],
          // Override default globIgnores so that dev-dist/sw.js is still matched
          // in development and Workbox does not warn about empty precache lists.
          globIgnores: ['**/node_modules/**/*'],
          runtimeCaching: [
            {
              urlPattern: ({ request }) =>
                request.destination === 'document' ||
                request.destination === 'script' ||
                request.destination === 'style',
              handler: 'NetworkFirst',
              options: {
                cacheName: 'html-js-css',
                networkTimeoutSeconds: 10,
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 7,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
      }),
    ],
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

