import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],

  // Vite root is /src — index.html lives there
  root: './src',
  publicDir: '../public',

  build: {
    outDir: '../public_html',
    emptyOutDir: true,
    sourcemap: false,
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@admin': path.resolve(__dirname, './src/admin'),
      '@clerk': path.resolve(__dirname, './src/clerk'),
      '@user': path.resolve(__dirname, './src/user'),
      '@contexts': path.resolve(__dirname, './src/contexts'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@styles': path.resolve(__dirname, './src/styles'),
    },
  },

  server: {
    port: 5175,
    watch: {
      ignored: [
        '**/public_html/**',
        '**/public/assets/**',
        '**/*.mp4',
        '**/*.mov',
        '**/*.webm',
        '**/tmp/**',
        '**/.git/**'
      ],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3005',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:3005',
        changeOrigin: true,
      },
    },
  },
});
