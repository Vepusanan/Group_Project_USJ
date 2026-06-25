import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: "/",
  plugins: [react()],
  resolve: {
    dedupe: ['pdfjs-dist'],
  },
  optimizeDeps: {
    include: ['pdfjs-dist', 'react-pdf'],
  },
  server: {
    port: 3000,
    open: true,
    strictPort: true,
    host: true,
    fs: {
      // Allow imports from repo-root shared/ (auth state machine).
      allow: [path.resolve(__dirname, "..")],
    },
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