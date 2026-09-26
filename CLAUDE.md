# Samvad

Samvad (संवाद, "dialogue") is a mobile-first web app that teaches Marathi to Hindi speakers. Stack: Next.js 16 (App Router) + Supabase (Postgres, Auth, Storage) + Tailwind v4 + shadcn/Base UI.

- **Plan:** `ROADMAP.md` holds the current plan, agreed decisions and how we split the work (Kiran writes backend to learn it; Claude builds frontend). Read it before any planning or feature work, tick off tasks when they are completed, and put new feature ideas under "Later".
- **Learning notes:** `LEARNING.md` is Kiran's backend/Next.js notebook. When a task teaches a concept worth keeping, offer to add a short entry there.

## Next.js 16

This version has breaking changes — APIs, conventions and file structure may differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing Next.js code, and heed deprecation notices.

## Code rules

1. Use Next.js best practices for a fast, scalable, maintainable app. Prefer async Server Components that call `lib/data/*` directly; use Client Components only for hooks, event handlers or browser APIs.
2. Use `export const` arrow functions instead of `export function` / `export async function` declarations.
3. Define interfaces and types in `lib/types.ts`, not inline in component or route files.
4. Do not create new components/files unless the user asks for one. If JSX is only used in one place, inline it there.

## Style rules

1. Don't set a text color for default text (no `text-black`, `text-[#111111]`) — black is already the default.
2. Prefer Tailwind's palette (`bg-gray-100`, `bg-neutral-200`) over arbitrary hex values. Use a hex only when a specific value is given.
3. Never use `leading-snug`.
4. Use the theme tokens below (`bg-coral`, `text-coral-strong`, `from-coral`, …) instead of raw hex codes.
5. Don't extract a `const` for a className applied unconditionally — write it inline. Only name class strings that are swapped conditionally.

## Design system

Tokens live in `app/globals.css` (`@theme inline`). Mobile-first: design at 375px width.

**Colors**

| Token | Hex | Use |
|---|---|---|
| `coral` | `#FF5C3F` | Brand accent: progress bars, highlights, `bg-coral/5` tints |
| `coral-light` | `#FF7A60` | Gradient partner for coral |
| `coral-strong` | `#D93A1F` | Primary buttons (also shadcn `--primary`) — darker for white-text contrast |
| `success` / `success-bg` | `#2E7D32` / `#EAF6EB` | Correct answers, success states |
| `error` / `error-bg` | `#A61B1B` / `#FFE8E8` | Wrong answers, error states |
| `brand-blue` / `brand-blue-light` | `#1456f0` / `#4d7cf5` | Hints and informational callouts (`bg-brand-blue/5`, `border-brand-blue/15`) |
| `surface` | `#f7f8fa` | Quiet section backgrounds |
| `muted` / `stone` | `#a8aab2` / `#8e8e93` | Secondary and tertiary text |

Keep coral for key moments (primary action, progress, celebration) — if everything is coral, nothing stands out.

**Typography:** Noto Sans everywhere (Latin + Devanagari), loaded via `next/font` in `app/layout.tsx`. Weights 400 / 500 / 600 / 700. Create hierarchy with size, weight and gray shades, not by bolding everything. Show Marathi in Devanagari with transliteration beneath in smaller gray text.

**Shapes and components**

- Buttons, pills, badges, progress bars: `rounded-full`.
- Primary CTA: full-width, `bg-coral-strong text-white rounded-full`, ~56–58px tall, `active:scale-[0.985] active:opacity-85`, `disabled:opacity-40`. Place it in the bottom third of the screen (thumb zone).
- Cards: `rounded-2xl`, `bg-gray-50` or white, `border border-gray-200`, `p-6`. Shadows stay soft (`shadow-sm` / `shadow-md`) or absent.
- Hint callout: `bg-brand-blue/5 border border-brand-blue/15 rounded-xl`, lucide `Lightbulb` icon.
- Icons: `lucide-react`; Material Symbols Rounded is loaded for the footer nav.

**Spacing and touch:** spacing values on the 4/8px grid (8, 12, 16, 24, 32, 48). Related items closer together, separate groups further apart. Tap targets at least 44×44px.

## UX principles (language-learning app)

- **Peak-end rule:** learners remember the best moment and the ending. Make lesson and practice completion feel rewarding (summary, progress affirmation, streak) and never let a session just stop.
- **Emotional feedback:** correct answers get encouragement, mistakes get a gentle correction with the right answer — not just a green tick or red cross.
- **Stage-aware UI:** new learners get a simple guided path; returning learners see their streak, what's due and where they left off.
- **Every state designed:** loading, empty (with guidance and a next action), error and success.
- **Selection over typing** for frequent answers; learners may not have a Devanagari keyboard.
