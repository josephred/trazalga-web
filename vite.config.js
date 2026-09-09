import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      },
      manifest: {
        name: 'Trazalga Sernapesca',
        short_name: 'Trazalga',
        description: 'Plataforma de Trazabilidad de Algas',
        theme_color: '#1a3a5c',
        background_color: '#f5f5f5',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  define: {
    __APP_VERSION__: JSON.stringify(
      `Version ${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}.${String(new Date().getHours()).padStart(2, '0')}${String(new Date().getMinutes()).padStart(2, '0')}`
    ),
  },
  server: {
    proxy: {
      '/v-api': {
        target: 'https://apps.procesac.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => {
          const stripped = path.replace(/^\/v-api/, '');
          if (stripped.startsWith('/sync') || stripped.startsWith('/api')) {
            return stripped;
          }
          return '/api' + stripped;
        },
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Removemos completamente la cabecera Origin para intentar saltar el chequeo CORS
            proxyReq.removeHeader('Origin');
            proxyReq.setHeader('Referer', 'https://apps.procesac.com/');
          });
        },
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        }
      },
      '/v-core': {
        target: 'https://apps.procesac.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/v-core/, ''),
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            proxyReq.removeHeader('Origin');
            proxyReq.setHeader('Referer', 'https://apps.procesac.com/');
          });
        },
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        }
      }
    }
  }
})
