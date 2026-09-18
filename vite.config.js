import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // Thêm dòng này
  ],
  server: {
    proxy: {
      '/api': {
        target: 'https://capstone-project-progress-tracking-system-be-production-afa9.up.railway.app',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Xóa Origin & Referer để bypass CORS check của Spring Security
            proxyReq.removeHeader('origin');
            proxyReq.removeHeader('referer');
          });
        },
      },
    },
  },
})