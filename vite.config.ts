import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      // Proxy root path for CSRF token fetching
      '/': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        bypass: (req) => {
          // Only proxy exact root path with JSON accept header (CSRF)
          if (req.url !== '/' && req.url !== '') {
            return req.url // let Vite handle all non-root paths
          }
          if (!req.headers.accept?.includes('application/json')) {
            return '/index.html' // serve SPA for HTML requests
          }
          return undefined // proxy to backend for CSRF token
        },
      },
    },
  },
})
