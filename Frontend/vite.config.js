import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

// Ensure Vite uses the Frontend folder as the project root even if started from
// a different working directory (e.g., from the monorepo root).
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
  root: __dirname,
  // Keep the default "public" behavior so assets are served from /<asset-name>
  publicDir: 'public',
  plugins: [react()],
  server: {
    proxy: {
      // Forward API calls to the backend server so the frontend can call /api/*
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      // Health check endpoint
      '/health': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
