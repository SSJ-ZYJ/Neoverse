# AGENTS.md

## Verification

- All changes must pass `bun run typecheck` or the full `bun run check`. The full check runs `biome check --write .`, the UI boundary and CSS checks, then Nuxt typecheck.
- **Style-only changes do not require visual verification.** Do not start a dev server or take screenshots; passing the code check is sufficient.

## Conventions

- All user-facing text must be added to **both** `i18n/locales/en.json` and `i18n/locales/zh-CN.json` with identical key structures.
- View ids and nav items are defined in `shared/constants.ts` (`NAV_ITEMS`). Renaming a route requires updating the `app/pages/` file, `NAV_ITEMS`, the skeleton mapping in `app/app.vue`, the `DashboardSkeleton` view type, and the `nav.*` i18n keys.
- Use design tokens from `app/assets/css/tokens.css` instead of hardcoded values.
- The Pulse page must never use mock/simulated data; show the unavailable state instead.
- `nuxt.config.ts` embeds critical fallback styles (`.skip-link`, `.dashboard-loading`, `[inert]`); keep them intact and ensure `bun run test:fouc` passes.

## Neoverse UI maintenance

- Import shared styles from `@neoverse-ui/tailwind/index.css`; CSS alone does not activate the Glass WebGL renderer. Preserve the `app/app.vue` lifecycle: create it only on the client, mount it on `onMounted`, and destroy it on `onBeforeUnmount`.
- Upgrade all five direct `@neoverse-ui/*` dependencies together. Preserve `UiDock` navigation geometry, `UiCard` with `glass-elevated`, the library's typography and Motion roles, and root `data-theme="dark"`.
- City camera choreography remains app-owned; keep its CSS return duration aligned with `CITY_WINDOW_HANDOFF_DURATION` in `app/composables/useCityMotionClock.ts`.
- Tailwind 4 handles vendor prefixes. Keep Autoprefixer disabled in `nuxt.config.ts`; it breaks the Disclosure `@supports` query. `bun run test:ui-css` checks the published CSS through Nuxt's production PostCSS configuration.
- Keep `@neoverse-ui/glass-runtime` and `@neoverse-ui/motion` in Nuxt's `build.transpile` list for their extensionless ESM imports. After UI package upgrades, run `bun run test:dev` against the development server.

## Commands

- `bun run dev` — start the Nuxt development server
- `bun run typecheck` — run Nuxt typecheck
- `bun run check` — full gate: Biome with writes, UI boundary, published CSS, and Nuxt typecheck
- `bun run test:fouc` — check critical SSR shell styles; requires a development server
- `bun run test:dev` — smoke-test every route on the development server
- `bun run test:ui-css` — check published UI CSS with the production PostCSS configuration
- `bun run test:repository-pulse` — test Pulse aggregation and completeness behavior
