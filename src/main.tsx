import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { env } from '@/lib/env'
import { queryClient, router } from './router'
import './index.css'

async function enableMocks() {
  if (!import.meta.env.DEV || !env.VITE_ENABLE_MOCKS) return
  const { worker } = await import('./mocks/browser')
  await worker.start()
}

await enableMocks()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
