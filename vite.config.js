import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
        rewrite: (path) => path.replace(/^\/v-api/, '/api'),
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
      }
    }
  }
})
