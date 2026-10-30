import { CircleCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

/** A short success message that clears itself after a few seconds */
export function useNotice(durationMs = 4000) {
  const [message, setMessage] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  const show = (text: string) => {
    clearTimeout(timer.current)
    setMessage(text)
    timer.current = setTimeout(() => setMessage(null), durationMs)
  }

  return [message, show] as const
}

/** Success banner; screen readers announce it through role="status" */
export function Notice({ message }: { message: string | null }) {
  return (
    <div role="status" aria-live="polite">
      {message && (
        <p className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
          <CircleCheck className="size-4 shrink-0" />
          {message}
        </p>
      )}
    </div>
  )
}
