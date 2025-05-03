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
        target: 'hhttp://localhost:8080/api',
        changeOrigin: true,
        secure: false,
      }
    },
    historyApiFallback: true
  },
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
})
