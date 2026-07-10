# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start dev server on localhost:3000
npm run build    # Production build
npm run lint     # Run ESLint
```

No test suite is configured yet.

## Architecture

**Samvad** is a language-learning app built on Next.js 16 (App Router) with Supabase for auth and data.

### Key directories

- `app/` — Next.js App Router. Pages and API routes live here.
- `app/api/` — REST API routes (Route Handlers). All data fetching for the client goes through these.
- `lib/supabase/` — Three Supabase client wrappers:
  - `client.ts` — browser client (for client components)
  - `server.ts` — server client (for Route Handlers and Server Components); reads cookies via `next/headers`
  - `middleware.ts` — session refresh + auth-based redirects, runs on every request via `middleware.ts` at the root (not yet created — `updateSession` is exported here for use there)

### Auth flow

Supabase Auth with SSR cookie handling (`@supabase/ssr`). The middleware redirects unauthenticated users away from protected paths (`/home`, `/lesson`, `/api/me`) to `/login`, and redirects authenticated users away from `/login` and `/signup` to `/home`. The OAuth callback lands at `/auth/callback`.

### Data model (inferred from API routes)

- `profiles` — user profile; joined to `language_pairs` via `active_language_pair_id`
- `language_pairs` — available language combinations, referenced by slug; has `is_active` flag
- `modules` — ordered learning modules per language pair (`order_index`, `is_locked_initially`)
- `lessons` — belong to modules; individual learning units
- `user_progress` — tracks lesson start/complete state per user (routes: `GET/POST /api/me/progress`, `/start`, `/complete`)

### API surface

| Route | Methods | Notes |
|---|---|---|
| `/api/me` | GET, PATCH | Profile with active language pair; auth-protected |
| `/api/me/progress` | GET | User progress; auth-protected |
| `/api/me/progress/start` | POST | Mark lesson started |
| `/api/me/progress/complete` | POST | Mark lesson completed |
| `/api/modules` | GET | Requires `?language_pair=<slug>` |
| `/api/modules/[moduleId]/lessons` | GET | Lessons for a module |
| `/api/lessons/[lessonId]` | GET | Single lesson detail |

### Design system

`DESIGN.md` contains a full design token spec (colors, typography, spacing, components) modeled after MiniMax's brand. Refer to it when building UI. Key points:
- DM Sans is the only typeface; pill buttons (`rounded-full`) everywhere
- Black (`colors.primary`) is the dominant CTA color
- Brand colors (coral, magenta, blue, purple) are reserved for product-identity cards only
- Tailwind CSS v4 is used; config lives in `postcss.config.mjs`
