import { CircleAlert, CircleCheck, X } from 'lucide-react'
import { create } from 'zustand'
import { cn } from '@/lib/utils'

type ToastTone = 'success' | 'error'

interface ToastItem {
  id: number
  tone: ToastTone
  message: string
}

interface ToastState {
  toasts: ToastItem[]
  push: (tone: ToastTone, message: string) => void
  dismiss: (id: number) => void
}

const DURATION_MS = 4500
let nextId = 1

const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (tone, message) => {
    const id = nextId++
    // Keep at most three on screen
    set({ toasts: [...get().toasts.slice(-2), { id, tone, message }] })
    setTimeout(() => get().dismiss(id), DURATION_MS)
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}))

/** Call from anywhere, e.g. after a save: toast.success('User created') */
export const toast = {
  success: (message: string) => useToastStore.getState().push('success', message),
  error: (message: string) => useToastStore.getState().push('error', message),
}

/** Mounted once at the app root. Screen readers announce new messages politely. */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed right-4 bottom-4 z-[60] flex w-[min(24rem,calc(100%-2rem))] flex-col gap-2"
    >
      {toasts.map((t) => {
        const Icon = t.tone === 'success' ? CircleCheck : CircleAlert
        return (
          <div
            key={t.id}
            className="toast-enter pointer-events-auto flex items-start gap-3 rounded-md border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-[0_8px_24px_rgb(22_24_42/0.14)]"
          >
            <Icon
              aria-hidden
              className={cn(
                'mt-0.5 size-4 shrink-0',
                t.tone === 'success' ? 'text-success' : 'text-danger',
              )}
            />
            <p className="flex-1">{t.message}</p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss"
              className="-mr-1 grid size-6 place-items-center rounded-sm text-muted hover:bg-accent hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
