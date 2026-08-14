# htmlincanvas-demo

A live catalog of [Canvas UI](https://canvasui.dev) — 33 shader effects running over one real,
interactive HTML page.

**→ [htmlincanvas.codyh.xyz](https://htmlincanvas.codyh.xyz)**

## Why this exists

- Canvas UI is a genuinely impressive library, and I wanted to actually *understand* what it
  could do rather than read a feature list.
- Chrome shipped an experimental API (`html-in-canvas`) that lets a shader sample **live DOM**
  — not a screenshot, not an iframe. That's new, and most people haven't seen it yet.
- Docs show effects one at a time. Nothing showed the same interface run through all of them,
  which is the fastest way to work out which effect is right for what.
- So: one page, one UI, 33 lenses, plus a note on what each effect is actually good for.

## What it does

- **Bench** — pick any of 28 lenses; they apply to a live specimen UI (console / storefront /
  editorial). The buttons still click and the input still types while it's being shattered.
- **Objects** — the 5 three.js renderers, all pointed at the same SVG. Feed them a GLB, SVG, or PNG.
- **Uses** — all 33 with the use case each one is genuinely best at.
- `F` applies the current effect to the entire page, including itself. `[` and `]` cycle. State
  lives in the URL: `?fx=shatter&surface=editorial`.

## Run it

```bash
npm install     # also fetches the Canvas UI components (see below)
npm run dev
```

18 of the 33 effects need Chrome's experimental html-in-canvas API. It's **off by default**
(verified on Chrome 151 — a clean profile reports `ctx.drawElementImage === undefined`).

```bash
npm run lab     # opens Chrome with the flag on, using a throwaway profile
```

That keeps the experimental paint path off your everyday browser — it's a global renderer
switch, so every site you visit gets it, and the API is gated for real privacy reasons
(it has to strip `:visited` state, cross-origin frames, autofill and system colors before
painting, or it becomes a history-sniffing oracle). Alternatively:
`chrome://flags/#canvas-draw-element` → Enabled → restart.

The other 15 effects (10 WebGL overlays + 5 three.js objects) need no flag at all.

## About the components

- The effects are **not** in this repo. `scripts/vendor.mjs` pulls them from Canvas UI's
  official shadcn registry into `src/canvasui/` on `npm install`.
- Canvas UI is MIT + Commons Clause: free to use in products, but the author asks that the
  components not be redistributed — so they're fetched, not vendored into git.
- Re-pull them any time with `npm run vendor`.
- They're standalone single files with no Tailwind and no `cn` helper, which is why this
  project skips `shadcn init` entirely.

## Credit

- **[Canvas UI](https://canvasui.dev)** by its author — every effect here is theirs. This repo
  is just a display case. If you like what you see, use their library, not my screenshots.
- **[WICG html-in-canvas](https://github.com/WICG/html-in-canvas)** — the explainer behind the
  API, including the security model that explains why it's still behind a flag.
- **[shadcn/ui](https://ui.shadcn.com)** — the registry protocol the components ship over.
- Specimen UIs, layout, copy, and the idea catalog are mine.

## License

MIT for the code in this repo. The Canvas UI components fetched at install stay under their
own license (MIT + Commons Clause) and are not covered by this one.
