1. Don't use `text-[#111111]` or any other arbitrary hex/black value for text color (e.g. `text-black`) — black is the browser/Tailwind default text color, so just omit the class entirely.
2. Prefer Tailwind's default color palette (e.g. `bg-gray-100`, `bg-neutral-200`) over arbitrary hex values like `bg-[#F0F0F0]`. Only use a hex code when a specific value is explicitly given (e.g. a design spec).
3. Never use `leading-snug`.
4. Brand color `#FF5C3F` is registered as `coral` and `#FF7A60` as `coral-light` in `app/globals.css` (`@theme inline`). Use `bg-coral`, `text-coral`, `from-coral`, etc. instead of the raw hex codes.
5. Don't extract a `const` for a className string that's applied unconditionally — write it directly in the template. Only pull classes into a named `const` when they're conditionally swapped in/out (e.g. based on state/variant).
