# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## GitHub Sync

Automatic GitHub sync is enabled via the **GitHub Sync** workflow (`scripts/github-sync.mjs`). It runs every 5 minutes and pushes new commits to `origin/main` (https://github.com/ToygarE/taximeterpro) using the `GITHUB_TOKEN` environment variable injected by the Replit GitHub integration. No manual push step is needed.

## Artifacts

### Taximeter Pro (`artifacts/taximeter-pro`)
- **Type**: Expo (React Native / PWA)
- **Preview path**: `/`
- **Purpose**: Professional taxi fare calculator app for Dutch taxi drivers
- **Features**:
  - Fare calculation based on 2026 Dutch legal maximum rates
  - Vehicle selection: Personenauto (max 4) / Taxibusje (5-8 persons)
  - Google Maps Distance Matrix API integration for route data
  - Offline fallback: manual KM/minutes input
  - International rides: extra costs for tolls/border surcharges
  - Settings screen to adjust rates (yearly government indexation)
  - Ride history with AsyncStorage persistence
  - PWA installable
- **Rates (2026 legal maximums)**:
  - Auto: Start €4.31 | KM €3.17 | Min €0.52
  - Bus: Start €8.77 | KM €4.00 | Min €0.59
  - Wait: €59.41/hour
- **Key files**:
  - `context/TaximeterContext.tsx` — global state + AsyncStorage persistence
  - `utils/berekeningen.ts` — fare calculation logic + Google API integration
  - `app/(tabs)/index.tsx` — main calculator screen
  - `app/(tabs)/history.tsx` — ride history
  - `app/(tabs)/settings.tsx` — rate management
- **Environment variables**:
  - `EXPO_PUBLIC_GOOGLE_MAPS_KEY` — Google Maps API key (optional, falls back to manual mode)
