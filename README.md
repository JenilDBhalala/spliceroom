# Spliceroom

Make Instagram posts from templates, or anything you like on the blank canvas (free text and photo layers): memes, tweet/X posts, quotes, comparisons, movie posters, movie lists, lessons, timelines, news and a follow card. Pick a template and a size (4:5, 1:1 or 9:16), add photos and text, tweak the text style (21 fonts), and download PNGs (carousels as a zip). Works on phones, and your work is saved in the browser.

```bash
npm install
npm run dev   # http://localhost:3000
```

## Layout

- `app/page.tsx`: loads the editor (client only)
- `components/`: top bar, preview, slide strip, per-slide panels and form fields
- `lib/render/`: pure canvas renderers, one file per template (the original six ported from `spliceroom-reference.html`)
- `lib/templates.ts`: the template picker's groups and the size options
- `lib/render/fonts.ts`: the font registry (canvas and picker); extra fonts load on first use
- `lib/site.ts`: site name, description and URL for SEO; set `NEXT_PUBLIC_SITE_URL` for a custom domain
- `app/fonts/`: self-hosted font files (SIL Open Font License), so builds don't fetch from Google
- `app/icon.svg`, `app/opengraph-image.tsx`, `app/robots.ts`, `app/sitemap.ts`, `app/manifest.ts`: tab icon, share image and SEO files
- `lib/store.ts`: zustand store; brand settings persist to localStorage
- `lib/export.ts`: PNG and zip download (jszip)

`SPLICEROOM_BRIEF.md` has the full spec and the remaining phases (drafts in IndexedDB, keyboard shortcuts, TMDB/OMDb lookup).
