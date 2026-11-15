# Fintara Dashboard — Frontend

Dashboard for the Fintara super admin, issuing banks and merchants: transactions, issuing
banks, merchants and users, with permission-based access and two-factor sign-in.

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev                  # http://localhost:5173
```

The app needs the Fintara backend. The dev server forwards `/api` to `API_PROXY_TARGET`
in `.env.local` (default `http://localhost:5076`).

## Build

```bash
npm run build                                                      # served at the site root
BASE_PATH=/merchant/ VITE_API_BASE_URL=/merchant/api/v1 npm run build   # served under /merchant/
```

The output is in `dist/`.

## Scripts

| Script              | What it does                            |
| ------------------- | --------------------------------------- |
| `npm run dev`       | Dev server with hot reload              |
| `npm run build`     | Typecheck + production build to `dist/` |
| `npm run preview`   | Serve the production build              |
| `npm run typecheck` | TypeScript only                         |
| `npm run lint`      | ESLint                                  |
| `npm run format`    | Prettier                                |
| `npm run test`      | Vitest                                  |
| `npm run audit`     | Check dependencies for vulnerabilities  |

## Stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · TanStack Router and Query · Zod ·
React Hook Form · Vitest

## Folder layout

```
src/
  routes/         Pages (file-based; routeTree.gen.ts is generated, don't edit)
  features/       API calls, schemas and components per feature
  components/     Shared UI and the app layout
  lib/            API client, env, utilities
  stores/         Client-only UI state
```
