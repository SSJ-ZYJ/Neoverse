# AGENTS.md

## Verification

- All changes are gated by the code check: run `bun run typecheck` or the full `bun run check` (Biome + typecheck) and confirm it passes.
- **Style-only changes do not require visual verification.** Do not start a dev server or take screenshots; passing the code check is sufficient.

## Conventions

- All user-facing text must be added to **both** `i18n/locales/en.json` and `i18n/locales/zh-CN.json` with identical key structures.
- View ids and nav items are defined in `shared/constants.ts` (`NAV_ITEMS`). Renaming a route requires updating the `app/pages/` file, `NAV_ITEMS`, the skeleton mapping in `app/app.vue`, the `DashboardSkeleton` view type, and the `nav.*` i18n keys.
- Use design tokens from `app/assets/css/tokens.css` instead of hardcoded values.
- The Pulse page must never use mock/simulated data; show the unavailable state instead.
- `nuxt.config.ts` embeds critical fallback styles (`.skip-link`, `.dashboard-loading`, `[inert]`); keep them intact and ensure `bun run test:fouc` passes.

## Commands

- `bun run dev` — dev server
- `bun run typecheck` — type check
- `bun run check` — Biome + typecheck (full gate)
- `bun run test:fouc` — verify critical shell styles in SSR HTML (requires dev server on `http://localhost:3000/`)
