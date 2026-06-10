import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // react-pdf bundles pdfjs-dist@5.4.x — force a single copy so the
    // worker file always matches the API version used by <Document>.
    dedupe: ['pdfjs-dist'],
  },
  optimizeDeps: {
    include: ['pdfjs-dist', 'react-pdf'],
  },
  server: {
    port: 3000,
    open: true,
    strictPort: false,
    host: true, // Add this to ensure it's accessible
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'axios-vendor': ['axios']
        }
      }
    }
  },
  preview: {
    port: 3000
  }
});