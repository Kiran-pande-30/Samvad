# Learning Notes

## 1. Server Components vs Client Components, and why `page.tsx` was refactored

**Next.js App Router default:** every component is a **Server Component** unless it has `'use client'` at the top.

| | Server Component | Client Component (`'use client'`) |
|---|---|---|
| Runs | Only on the server | On server (for initial HTML) + in the browser (hydration) |
| Can use `useState`/`useEffect`/`onClick` | No | Yes |
| Can `await` a DB call directly | Yes | No — needs an API route + `fetch` |
| Ships JS to the browser | No | Yes |

**The problem before:** `page.tsx` was entirely `'use client'` just to fetch data. That forced a waterfall:
`useEffect` fires → `fetch('/api/me')` → `fetch('/api/modules')` → one `fetch` per module for lessons (N+1 requests) — each one a real browser→server round trip, even though every API route just turned around and queried Supabase anyway.

**The fix:** made `page.tsx` an `async` Server Component. It now calls the data functions (`getAuthenticatedUser`, `getProfile`, `getModulesWithLessons`) **directly**, no `fetch`, no API route hop, no loading spinner — the HTML sent to the browser already has the data in it.

**What still needs to be a Client Component:** anything using hooks, event handlers, or browser-only APIs. Simple navigation (`router.push`) doesn't actually need this — `<Link href="...">` from `next/link` does it with zero client JS.

---

## 2. Types should describe what a function *actually* returns, not the full DB row

`Module`/`Lesson` in `lib/types.ts` model the full database row (every column the table has). But `getModulesByLanguagePair`/`getModuleLessons` in `lib/data/modules.ts` don't return every column:

- `getModulesByLanguagePair` queries `select('*, lessons(count)')` (fetches everything from Postgres) but then manually rebuilds a plain object with only 5 fields — the rest is fetched then **discarded in JS**.
- `getModuleLessons` queries `select('id, title, intro_text, module_id, order_index')` — `created_at` is **never fetched from Postgres at all**.

Either way, the caller never sees `created_at`/`language_pair_id`. The original `ModuleWithLessons` type claimed those fields existed (`extends Module`), which was a lie TypeScript should have caught. Fix: added `ModuleSummary`/`LessonSummary` (`Omit<...>` of the full type) so the type matches the real runtime shape. Trimming columns like this is good practice (less data over the wire, less risk of leaking internal fields) — the types just need to be honest about it.

---

## 3. `Promise.all` for concurrent async work

```ts
return Promise.all(
  modules.map(async (module) => ({
    ...module,
    lessons: await getModuleLessons(supabase, module.id),
  }))
)
```

- `.map()` with an `async` callback returns an **array of Promises** immediately (each call starts right away — they all run concurrently, not one after another).
- `Promise.all([...])` waits for *all* of them to resolve, then resolves with an array of the actual results, in the original order.
- This is much faster than a `for` loop with `await` inside it, which would run each query serially (one after another) — for N modules, that's `N × query_time` vs. roughly `1 × query_time`.
- Gotcha: `Promise.all` is all-or-nothing — if any single promise rejects, the whole thing rejects immediately, even if the others already succeeded. Use `Promise.allSettled` instead if partial success should be tolerated.
