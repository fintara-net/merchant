import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { buttonVariants } from '@/components/ui/button'
import { logout } from '@/features/auth/api'
import { cn } from '@/lib/utils'

/** For pages a user must finish before using the dashboard: lets them leave instead. */
export function SignOutLink() {
  const router = useRouter()
  const queryClient = useQueryClient()
  return (
    <button
      type="button"
      className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'text-muted')}
      onClick={() =>
        void logout()
          .catch(() => undefined)
          .finally(() => {
            queryClient.clear()
            void router.navigate({ to: '/login' })
          })
      }
    >
      Sign out
    </button>
  )
}
