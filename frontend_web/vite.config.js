import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis'
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext'
    },
    include: ['react-pdf', 'pdfjs-dist/build/pdf.worker.min']
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      }
    },
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  },
  base: '/',
  build: {
    target: 'esnext',
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          'pdf.worker': ['pdfjs-dist/build/pdf.worker.min']
        }
      }
    }
  },
  assetsInclude: ['**/*.worker.min.js'],
  // Copy the PDF worker file to the public directory during build
  publicDir: 'public',
  resolve: {
    alias: {
      // Ensure PDFjs worker can be resolved properly
      'pdfjs-dist': 'pdfjs-dist'
    }
  }
})
