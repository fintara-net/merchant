import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { Link, useRouter } from '@tanstack/react-router'
import { ChevronDown, KeyRound, LogOut, ShieldCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { logout, sessionQueryOptions } from '@/features/auth/api'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { USER_TYPE_LABELS } from '@/features/users/schemas'
import { cn } from '@/lib/utils'

export function UserMenu() {
  const { data: user } = useSuspenseQuery(sessionQueryOptions)
  const [open, setOpen] = useState(false)

  // Sign-out asks for confirmation first
  const [confirmOpen, setConfirmOpen] = useState(false)

  const ref = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()
  const router = useRouter()

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSettled: async () => {
      queryClient.clear()
      await router.navigate({ to: '/login' })
    },
  })

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2.5 rounded-md p-1 text-left transition-colors hover:bg-accent"
      >
        <span
          aria-hidden
          className="grid size-8 shrink-0 place-items-center rounded-md bg-primary-soft text-sm font-semibold text-primary"
        >
          {user.name.charAt(0).toUpperCase()}
        </span>
        <span className="hidden min-w-0 sm:block">
          <span className="block max-w-40 truncate text-sm font-semibold">{user.name}</span>
          <span className="block max-w-40 truncate text-xs text-muted">
            {USER_TYPE_LABELS[user.userType]}
          </span>
        </span>
        <ChevronDown
          className={cn(
            'hidden size-4 text-muted transition-transform sm:block',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-60 overflow-hidden rounded-md border border-border bg-surface p-1 shadow-[0_8px_24px_rgb(20_25_42/0.12)]"
        >
          <div className="border-b px-3 py-2.5">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
            <p className="mt-1.5 truncate text-xs text-muted">
              {USER_TYPE_LABELS[user.userType]}
              {user.organisation && `, ${user.organisation.name}`}
            </p>
          </div>
          <Link
            to="/change-password"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm transition-colors hover:bg-accent"
          >
            <KeyRound className="size-4" /> Change password
          </Link>
          <Link
            to="/two-factor"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm transition-colors hover:bg-accent"
          >
            <ShieldCheck className="size-4" /> Two-factor authentication
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              setConfirmOpen(true)
            }}
            className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-danger transition-colors hover:bg-danger-soft disabled:opacity-50"
          >
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      )}

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Sign out?"
        description="You'll need your password and authenticator code to sign in again."
        className="max-w-sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={logoutMutation.isPending}
              onClick={() => logoutMutation.mutate()}
            >
              Sign out
            </Button>
          </>
        }
      />
    </div>
  )
}
