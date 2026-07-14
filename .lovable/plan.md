## Swap brand logo to the new SVG

Replace the current scissors-based `BrandLogo` component with the uploaded `THE_ROOM_LOGO.svg` (framed "THE ROOM" wordmark). I'll add the "PRIVATE HAIR STUDIO / BY APPOINTMENT ONLY" tagline in code — no need for a second SVG file — so we keep one clean asset and control the tagline typography/spacing directly.

### Steps

1. Upload `user-uploads://THE_ROOM_LOGO.svg` to CDN via `lovable-assets` → `src/assets/the-room-logo.svg.asset.json`.
2. Rewrite `src/components/brand-logo.tsx`:
   - Inline the SVG paths (so `currentColor` still drives color via Tailwind `text-*` classes — an `<img>` tag can't be recolored).
   - `variant="full"` → framed logo + tagline lines "PRIVATE HAIR STUDIO" and "BY APPOINTMENT ONLY" underneath (used on `/welcome`, `/login`).
   - `variant="horizontal"` → framed logo only, compact (used in dashboard navbar).
   - `variant="mark"` → framed logo only, square.
3. No changes needed at call sites — same component API.

### Not doing

- Not touching favicon (separate task if you want).
- Not editing colors of the logo in pages that already set `text-*` classes.
