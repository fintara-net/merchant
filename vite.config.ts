import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'

export default defineConfig(({ mode }) => {
  // Not exposed to the app: only the dev server reads it
  const { API_PROXY_TARGET = 'http://localhost:5076' } = loadEnv(mode, process.cwd(), '')

  return {
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
