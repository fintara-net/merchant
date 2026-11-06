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

  //state for logout confirmation dialog
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
        className="flex items-center gap-3 rounded-xl p-1.5 text-left transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-primary"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 font-semibold text-primary">
          {user.name.charAt(0).toUpperCase()}
        </span>
        <span className="hidden min-w-0 sm:block">
          <span className="block max-w-48 truncate text-sm font-semibold">{user.name}</span>
          <span className="block max-w-48 truncate text-xs text-muted">
            {user.organisation?.name ?? user.email}
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
          className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border bg-surface p-1 shadow-lg shadow-brand-600/10"
        >
          <div className="border-b px-3 py-2.5">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
            <p className="mt-1.5 truncate text-xs text-muted">
              {USER_TYPE_LABELS[user.userType]}
              {user.organisation && ` · ${user.organisation.name}`}
            </p>
          </div>
          <Link
            to="/change-password"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent"
          >
            <KeyRound className="size-4" /> Change password
          </Link>
          <Link
            to="/two-factor"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent"
          >
            <ShieldCheck className="size-4" /> Two-factor authentication
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false) //close the dropdown
              setConfirmOpen(true) //then open the popup
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger transition-colors hover:bg-danger/10 disabled:opacity-50"
          >
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      )}

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Sign out?"
        description="You'll need to sign in again to access the dashboard."
        className="max-w-sm"
      >
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => setConfirmOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            disabled={logoutMutation.isPending}
            onClick={() => logoutMutation.mutate()}
          >
            {logoutMutation.isPending ? 'Signing out…' : 'Sign out'}
          </Button>
        </div>
      </Dialog>
    </div>
  )
}
