# Spliceroom

Make Instagram posts from templates: memes, tweet/X posts, quotes, comparisons, movie posters, movie lists, lessons, timelines, news and a follow card. Pick a template and a size (4:5, 1:1 or 9:16), add photos and text, tweak the text style, and download PNGs (carousels as a zip). Works on phones.

```bash
npm install
npm run dev   # http://localhost:3000
```

## Layout

- `app/page.tsx`: loads the editor (client only)
- `components/`: top bar, preview, slide strip, per-slide panels and form fields
- `lib/render/`: pure canvas renderers, one file per template (the original six ported from `spliceroom-reference.html`)
- `lib/templates.ts`: the template picker's groups and the size options
- `app/fonts/`: self-hosted font files (SIL Open Font License), so builds don't fetch from Google
- `lib/store.ts`: zustand store; brand settings persist to localStorage
- `lib/export.ts`: PNG and zip download (jszip)

`SPLICEROOM_BRIEF.md` has the full spec and the remaining phases (drafts in IndexedDB, keyboard shortcuts, TMDB/OMDb lookup).
