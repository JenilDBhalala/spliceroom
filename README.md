# Spliceroom

Make Instagram cinema posts: pick a format, drop in movie stills, type text, download 1080 × 1350 PNGs (carousels as a zip).

```bash
npm install
npm run dev   # http://localhost:3000
```

## Layout

- `app/page.tsx`: loads the editor (client only)
- `components/`: top bar, preview, slide strip, per-slide panels and form fields
- `lib/render/`: pure canvas renderers, one file per format, ported from `spliceroom-reference.html`
- `lib/store.ts`: zustand store; brand settings persist to localStorage
- `lib/export.ts`: PNG and zip download (jszip)

`SPLICEROOM_BRIEF.md` has the full spec and the remaining phases (drafts in IndexedDB, keyboard shortcuts, TMDB/OMDb lookup).
