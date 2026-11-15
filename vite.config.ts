import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'

export default defineConfig(({ mode }) => {
  // Not exposed to the app: only the dev server and the build read these.
  // BASE_PATH: where the built app is served, e.g. /merchant/ (must start and end with /).
  const env = loadEnv(mode, process.cwd(), '')
  const API_PROXY_TARGET = env.API_PROXY_TARGET || 'http://localhost:5076'
  const BASE_PATH = env.BASE_PATH || '/'
  if (!BASE_PATH.startsWith('/') || !BASE_PATH.endsWith('/')) {
    throw new Error(`BASE_PATH must start and end with "/" (got "${BASE_PATH}")`)
  }

  return {
    base: BASE_PATH,
    plugins: [
      // Must come before the React plugin
      tanstackRouter({ target: 'react', autoCodeSplitting: true }),
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      port: 5173,
      // The browser talks only to the dev server, which forwards /api to the backend.
      // Same origin means the refresh cookie works and no CORS setup is needed.
      proxy: { '/api': { target: API_PROXY_TARGET, changeOrigin: true } },
    },
    build: { sourcemap: false },
  }
})
