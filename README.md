<div align="center">

# Neoverse

**Shenshijun's personal digital space** — a dark-only portfolio with four dock-navigated routes, built with Nuxt 4.

[![Nuxt](https://img.shields.io/badge/Nuxt-4.0-00DC82?logo=nuxt&logoColor=white)](https://nuxt.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Bun](https://img.shields.io/badge/Bun-1.3-FBF0DF?logo=bun&logoColor=white)](https://bun.sh)

</div>

---

## Overview

Neoverse is a public personal site for **software engineering, open source, and agentic development**. It presents identity, selected work, current areas of focus, and verifiable developer activity across four Dock-navigated pages. Every page mounts only its own content — a persistent bottom dock switches between real routes, and missing data is never replaced with simulated activity.

## Views

| Route | View | What it shows |
| -------- | ---- | ------------- |
| `/` | **Home** | Identity, hero scene, and generative constellation |
| `/projects` | **Projects** | Curated, product-first previews of real projects |
| `/focus` | **Focus** | The engineering domains currently being explored |
| `/pulse` | **Pulse** | A truthful, source-bounded view of GitHub activity |
| `/design` | **Design** | Design-system showcase (hidden, `noindex`) |

The **Pulse** view renders a contribution calendar (with year total and longest streak), recent commits, and a traceable activity timeline — all served by a cached, server-only integration. When the source is unavailable or incomplete, that state stays explicit.

The `/design` route (not dock-navigated, `noindex`) showcases the design system itself — token swatches, glass/ghost buttons, and the segmented control in preview and code modes.

## Tech Stack

| Layer | Choice |
| --- | --- |
| Framework | [Nuxt 4](https://nuxt.com) (Vue 3, Nitro server) |
| Language | TypeScript, strict mode with type checking |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) via `@tailwindcss/vite` |
| Fonts | Inter Variable (`@fontsource-variable/inter`) |
| Icons | Iconify sets via `unplugin-icons` (lucide, simple-icons) |
| i18n | [@nuxtjs/i18n v10](https://i18n.nuxtjs.org) — `en` / `zh-CN`, cookie-based detection |
| Tooling | [Biome](https://biomejs.dev) (format + lint), Bun |

## Getting Started

> Requires [Bun](https://bun.sh) 1.3+ (or npm as a fallback — the scripts are package-manager agnostic).

```bash
# Install dependencies
bun install

# Start the dev server
bun run dev

# Type check
bun run typecheck
```

The homepage works without any credentials. Set `NUXT_GITHUB_TOKEN` to let the Nitro endpoint fetch GitHub's full yearly contribution calendar and 30-day public repository distribution via GraphQL. Without it, the calendar falls back to the last 84 days reconstructed from public REST events, while repository-level aggregates remain unavailable.

### Environment Variables

| Variable | Required | Description |
| ----------------- | -------- | ----------- |
| `NUXT_GITHUB_TOKEN` | No | Enables the full-year contribution calendar and 30-day public repository pulse (GraphQL). Public REST activity works without it. |

## Scripts

| Command              | Description                          |
| -------------------- | ------------------------------------ |
| `bun run dev`        | Start the Nuxt dev server            |
| `bun run build`      | Production build                     |
| `bun run preview`    | Preview the production build         |
| `bun run generate`   | Pre-render the site to static files  |
| `bun run typecheck`  | Run `nuxt typecheck`                 |
| `bun run lint`       | Biome check (read-only)              |
| `bun run lint:fix`   | Biome check with autofixes           |
| `bun run format`     | Format the codebase with Biome       |
| `bun run format:check` | Verify formatting without writing |
| `bun run check` | Biome lint+format with autofixes, then type check (full gate) |
| `bun run test:fouc` | Verify critical shell styles in SSR HTML (needs dev server on `http://localhost:3000/`) |
| `bun run test:home-behavior` | Verify home link animations stay data-driven |
| `bun run test:route-background` | Verify route transition background invariants |
| `bun run test:pulse-transition` | Verify Pulse route-transition gating and shared loading shimmer |
| `bun run test:skeleton-alignment` | Verify boot skeletons mirror live view geometry |

## Project Structure

```text
app/
  app.vue                 # Boot skeleton, route transitions, skip link, dock & footer chrome
  assets/css/
    tokens.css            # Design tokens (colors, surfaces, radii, motion)
    main.css              # Tailwind entry + global styles (imports tokens.css)
  components/
    BaseSkeleton.vue      # Shared skeleton building block
    DashboardSkeleton.vue # Boot-time loading skeleton, one per view
    CustomScrollbar.vue   # Custom scrollbar chrome (client-only)
    SiteFooter.vue        # Footer (ICP filing link)
    design/               # Design-system showcase (DesignSection)
    focus/                # Semantic development network (FocusSection)
    home/                 # Hero scene & cosmos visuals (HomeSection, HomeCosmos)
    navigation/           # Persistent bottom dock (BottomDock)
    project/              # Product-first project previews (ProjectCard, ProjectSection)
    pulse/                # GitHub contribution & activity views (PulseSection, Contribution*)
    ui/                   # Reusable primitives (UiGlassButton, UiSegmentedControl)
  composables/            # useGithubPulse, useProjectPreviews, useRouteTransitionState, useSlidingIndicator, useViewNavigation
  pages/                  # index / projects / focus / pulse / design — real routes
i18n/
  i18n.config.ts          # Vue I18n runtime config
  locales/                # en.json, zh-CN.json (via @nuxtjs/i18n v10)
server/
  api/github/pulse.get.ts    # Cached, server-only GitHub integration (REST + GraphQL fallback)
  api/projects/previews.get.ts # Cached live project previews (docs chapters, blog RSS articles)
  utils/project-previews.ts  # Docs sitemap & blog feed parsers for the previews endpoint
shared/
  constants.ts            # SITE, HOME_LINKS, NAV_ITEMS, FOCUS_DOMAINS, PROJECTS, createEmptyPulse, createEmptyProjectPreviews
  types/github.ts         # Shared GitHub API types
  types/projects.ts       # Shared project preview types
scripts/
  check-critical-shell.ts   # FOUC guard — critical shell styles present in SSR HTML
  check-home-behavior.ts    # Home link data-driven animation invariants
  check-route-background.ts # Route transition background invariants
  check-pulse-transition.ts # Pulse route-transition gating & shared shimmer invariants
  check-skeleton-alignment.ts # Boot skeletons mirror live view geometry
public/
  images/                 # Static imagery (home-city, home-orbit, project previews)
```

The `shared/` directory is imported from both client and server code via the `#shared` alias, keeping the GitHub response types and site constants in one place. The `scripts/` directory holds standalone verification scripts (run with `bun`) that assert the invariants behind the `test:*` package scripts.

Root-level files: `nuxt.config.ts` (framework config, i18n module, critical shell styles), `package.json` / `bun.lock` (Bun-managed dependencies), `biome.json` (format + lint rules), `tsconfig.json` (strict TypeScript, `unplugin-icons` types), `.env.example` (GitHub token template), `AGENTS.md` (agent conventions & verification gates), `CONTEXT.md` (code context notes). Generated directories (`.nuxt/`, `.output/`) and local state (`.env`, `.pi/`) are gitignored.

---

[![License](https://img.shields.io/badge/License-SATA--2.0-9F5CCF)](LICENSE)
