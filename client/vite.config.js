import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: "/",
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
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('react-pdf') || id.includes('pdfjs-dist')) {
            return 'pdf-vendor';
          }
          if (id.includes('@supabase/supabase-js')) {
            return 'supabase-vendor';
          }
          if (id.includes('react-router') || id.includes('react-dom') || id.includes('/react/')) {
            return 'react-vendor';
          }
          if (id.includes('axios')) {
            return 'axios-vendor';
          }
          if (id.includes('lucide-react')) {
            return 'icons-vendor';
          }
        },
      },
    },
  },
  preview: {
    port: 3000
  }
});