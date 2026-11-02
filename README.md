# Fintara Dashboard — Frontend

Internal SPA dashboard: transactions, issuing banks, merchants and user management, with
permission-based access for three kinds of users (Super Admin, Bank, Merchant).

All commands below run **inside this `Frontend/` folder**.

## Quick start

```bash
cd Frontend                  # from the repo root
npm install
cp .env.example .env.local   # already done in the scaffold
npm run dev                  # http://localhost:5173
```

The app talks to the real backend (`../Backend`). Start it first; the dev server forwards
`/api` to `API_PROXY_TARGET` (default `http://localhost:5076`), so the browser sees one
origin and the sign-in cookie just works.

Sign in with the super admin's **email or username** and password. They come from
`SuperAdmin:Username / Email / Password` in the backend's git-ignored
`appsettings.Development.json` and are used only when the database has no users yet.

How sign-in works:

- The access token (15 min) is kept only in memory, never in local or session storage.
- The refresh token is in an httpOnly cookie that scripts can't read, sent only to `/api/v1/auth`.
- After a reload, or when the access token expires, the app quietly gets a new one; if that
  fails it goes back to the sign-in page.
- 5 wrong passwords lock the account for 15 minutes; 10 attempts a minute per address get "too many attempts".

Issuing banks, merchants and users are **sample data kept in the browser** (Zustand stores in
`features/*/store.ts`). Changes reset on page reload until the backend APIs are connected.
The transactions list is empty until the transactions API exists.

## Scripts

| Script              | What it does                            |
| ------------------- | --------------------------------------- |
| `npm run dev`       | Dev server with HMR                     |
| `npm run build`     | Typecheck + production build to `dist/` |
| `npm run preview`   | Serve the production build              |
| `npm run typecheck` | TypeScript only                         |
| `npm run lint`      | ESLint                                  |
| `npm run format`    | Prettier (also sorts Tailwind classes)  |
| `npm run test`      | Vitest (watch mode)                     |
| `npm run audit`     | Check runtime deps for vulnerabilities  |

## Stack

React 19 · TypeScript 6 · Vite 8 · Tailwind CSS v4 · TanStack Router (file-based, type-safe) ·
TanStack Query · Zod 4 · React Hook Form · Zustand · Vitest + Testing Library · ESLint 10 · Prettier

## Folder layout

```
src/
  routes/            File-based routes (routeTree.gen.ts is generated — don't edit)
    __root.tsx       Root layout, 404, devtools
    login.tsx        Public sign-in page
    _app.tsx         Auth guard + app shell for everything under _app/
    _app/…           Feature pages (each declares its required permission)
  features/<name>/   API calls, Zod schemas, query options, feature components
  features/auth/     Login, session (/auth/me) incl. user type + organisation
  features/issuing-banks/
                     Table, add/edit form, temporary in-memory data (store.ts)
  features/merchants/
                     Table, add/edit form (creates the merchant's login too), sample data
  features/users/    User list, form, account actions, user types, sample merchant logins
  features/transactions/
                     Filters, table, formatting, scope.ts (what each user type may see)
  features/permissions/
                     PERMISSIONS keys, usePermissions(), <Can>, requirePermission()
  components/ui/     Reusable primitives (Button, Dialog, ConfirmDialog, Select, Checkbox,
                     Field, Notice, Pagination, Switch, Table…)
  components/layout/ App shell, sidebar, user menu, Page card
  stores/            Client-only UI state (Zustand), e.g. sidebar collapsed
  lib/               api-client (fetch + Zod validation), query client, env, utils,
                     shared form fields (username, name, phone, email) in schemas.ts
```

## Adding a page

1. Create `src/routes/_app/<name>/index.tsx` — the router plugin wires it up automatically.
2. Add `beforeLoad: ({ context }) => requirePermission(context.queryClient, PERMISSIONS.X)`.
3. Put API calls, Zod schemas and components in `src/features/<name>/`.
4. Wrap the page content in `<Page title="…">` from `src/components/layout/page.tsx`.
5. Add a sidebar entry in `src/components/layout/nav-items.ts`.

See [PLAN.md](./PLAN.md) for architecture decisions and the roadmap.
