import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis'
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://barangay360-nja7q.ondigitalocean.app',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
