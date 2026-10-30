# Fintara Dashboard — Plan

## 1. Goals

- One SPA for **Fintara staff, banks and merchants**: transactions, issuing banks, merchants and
  user management, with more modules later.
- **Permissions come from the backend** (`GET /me/permissions`). The UI hides what users can't do;
  the backend enforces it.
- Latest stable tooling, strict TypeScript, no known-vulnerable packages.

## 2. Tech decisions

| Area          | Choice                         | Why                                                                               |
| ------------- | ------------------------------ | --------------------------------------------------------------------------------- |
| Build         | Vite 8                         | Fast dev server, small production bundles                                         |
| UI            | React 19                       | Current stable                                                                    |
| Language      | TypeScript 6.0 (strict)        | TS 7 is out but `typescript-eslint` doesn't support it yet — upgrade when it does |
| Styling       | Tailwind CSS v4                | CSS-first config (`@theme` in `index.css`), no `tailwind.config.js`               |
| Routing       | TanStack Router                | Type-safe links + search params, `beforeLoad` guards, per-route code splitting    |
| Server state  | TanStack Query                 | Caching, retries, background refetch, devtools                                    |
| Client state  | Zustand                        | Sidebar state; temporary sample data until the APIs exist                         |
| Validation    | Zod 4                          | Validates env, forms, URL search params **and every API response**                |
| Forms         | React Hook Form + Zod resolver | Fast, typed forms                                                                 |
| Mock API      | MSW 3                          | Build the UI before the backend exists                                            |
| Tests         | Vitest + Testing Library       | Shares Vite config                                                                |
| UI primitives | Hand-written with `cva`        | Same style as shadcn/ui; can add shadcn components later                          |

## 3. Auth & permissions design

**Session:** the backend sets an **httpOnly, Secure, SameSite cookie** on `POST /auth/login`.
The frontend never stores tokens in `localStorage` (protects against token theft via XSS).
All requests use `credentials: 'include'`.

**Flow:**

1. Any route under `_app/` runs `beforeLoad` → loads `/auth/me` and `/me/permissions` (cached 5 min).
2. 401 → redirect to `/login?redirect=<current path>` (redirect is checked to be a local path).
3. Each page's `beforeLoad` calls `requirePermission(...)` → `/forbidden` if missing.
4. Inside pages, `<Can permission={...}>` and `usePermissions().can(...)` hide buttons/actions.
5. Sidebar only shows items the user has permission for.
6. A 401 from any later request clears the cache and sends the user to login.

**User types** (`features/users/schemas.ts`) decide _which data_ a user sees:

| Type        | Belongs to       | Sees                                                     |
| ----------- | ---------------- | -------------------------------------------------------- |
| Super Admin | nobody (Fintara) | everything; manages banks, merchants and users           |
| Bank        | one issuing bank | only transactions where the card was issued by that bank |
| Merchant    | one merchant     | only its own transactions                                |

Permissions decide _what they can do_; the sidebar is the static `NAV_ITEMS` list filtered by the
permissions returned at login. A user's type and organisation can't change after creation.
`features/transactions/scope.ts` hides filters/columns per type and pins the bank/merchant filter,
but **the backend must apply the same restriction from the signed-in user** — never trust the
filters the browser sends.

**Logins per organisation:** the data model is "one organisation, many users". For now each
merchant gets exactly one login, created together with the merchant; `Merchant` is not offered on
the New User form (`CREATABLE_USER_TYPES`). Later: add Admin/Staff roles per organisation and
re-enable it, without changing the data model.

**Permission keys** live in `src/features/permissions/permissions.ts` as `resource:action`
(e.g. `transactions:read`, `users:manage`). Agree on this list with the backend team.

**Expected API contract (to confirm with backend):**

The backend in `../Backend` currently signs in with `{ username, password }`, returns a bearer
token plus a refresh cookie, and sends permissions as resource bitmasks (`{ "branch": 7 }`).
Connecting it needs either an adapter here or backend changes; see the backend notes.

```
POST /auth/login        { email, password } → User        (sets cookie)
POST /auth/logout       → 204                             (clears cookie)
GET  /auth/me           → User | 401   (User includes userType + organisation {id, name} | null)
GET  /me/permissions    → { permissions: string[] }
GET  /transactions      ?page&pageSize&range&status&mode&bank&merchant&searchBy&q
                        → { items, page, pageSize, total }   (scoped server-side by user)
GET  /issuing-banks     → IssuingBank[]        POST/PUT for super admins
GET  /merchants         → Merchant[]           POST creates the merchant + its login
GET  /users             ?type&merchant&page&pageSize → { items, page, pageSize, total }
POST /users/:id/lock | unlock | activate | deactivate | reset-password | reset-device
```

Money is sent in **minor units** (integer cents) plus an ISO currency code — never floats.

## 4. Roadmap

### Phase 0 — Scaffold ✅ (done)

- Project setup, lint/format/test, Tailwind v4 theme with light/dark tokens
- API client with Zod validation, Query + Router integration
- Auth guard, permission system, sidebar, login page, 404/403 pages
- Placeholder pages for Overview, Transactions, Issuing banks, Users; MSW mock API

### Phase 1 — UI pages ✅ (done, on sample data)

- Login, app shell, collapsible sidebar, user menu with sign-out confirmation
- Transactions: filters (date, status, mode, bank, merchant, search), table, export button
- Issuing banks: list + add/edit
- Merchants: list + add/edit, creates the merchant's login
- Users: list, filters, create/edit, lock, activate/deactivate, reset password, reset device
- User types Super Admin / Bank / Merchant; filters, columns and sidebar follow the user type

### Phase 2 — Connect the backend

- [ ] Auth: username login, bearer token in memory + refresh cookie, map bitmask permissions
- [ ] Backend: tenant type (Bank/Merchant), one tenant per user, block deactivated users/tenants,
      scope user update/delete/suspend to the caller's tenant, tighten CORS
- [ ] APIs for transactions, issuing banks, merchants, users; replace the Zustand sample stores
- [ ] Reset password + reset device endpoints; audit log

### Phase 3 — Foundations

- [ ] CI (GitHub Actions: typecheck, lint, test, build, `npm audit`)
- [ ] Confirm API contract + permission keys with backend; generate types from OpenAPI if available
- [ ] Decide CSRF strategy with backend (SameSite cookie + CSRF header for mutations)
- [ ] Add shadcn/ui (or similar) for Dialog, Dropdown, Toast, Select, Date picker
- [ ] Theme toggle (light/dark/system), user menu, breadcrumbs
- [ ] Data table component (TanStack Table): sorting, column visibility, URL-synced filters

### Phase 4 — Feature modules

- [ ] **Transactions:** filters (date range, bank, status, amount), detail drawer, CSV export (`transactions:export`)
- [ ] **Issuing banks:** list, detail, create/edit forms (`issuing_banks:manage`)
- [ ] **User management:** invite, edit role, disable/enable, role → permission matrix (`users:manage`)
- [ ] **Overview:** real KPIs + charts (e.g. Recharts) from a summary endpoint

### Phase 5 — Hardening

- [ ] Session timeout / idle logout, re-auth for sensitive actions
- [ ] Audit log page
- [ ] Error tracking (e.g. Sentry) with PII scrubbing; mask card numbers (show last 4 only)
- [ ] Content-Security-Policy + security headers on the hosting layer
- [ ] Component tests for guards; Playwright E2E for login + permission flows
- [ ] Accessibility pass, i18n if needed

## 5. Security rules for the team

- Frontend permission checks are **UX only** — the backend must enforce every action.
- No tokens or PII in `localStorage` / `sessionStorage` / URLs / logs.
- Validate all API responses with Zod (already built into `api.get/post/...`).
- Exact dependency versions (`.npmrc save-exact`); run `npm audit` in CI and review Dependabot/Renovate PRs.
- Never render raw HTML from the API (`dangerouslySetInnerHTML`).
- Only `VITE_*` env vars reach the browser — never put secrets in them.
