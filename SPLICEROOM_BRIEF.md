# Spliceroom: build brief for Claude Code

Paste this whole file into Claude Code together with `spliceroom-reference.html`.

---

## Prompt to give Claude Code

> Build **Spliceroom**, a Next.js (App Router, TypeScript) + Tailwind CSS app for making Instagram cinema posts.
> `spliceroom-reference.html` is a working single-file prototype. Treat it as the **source of truth for every slide layout, size, font and color**. Port its canvas rendering logic exactly, then restructure it into a clean Next.js codebase as described in `SPLICEROOM_BRIEF.md`.
> Work in phases, and run the app after each phase so I can check it.

---

## 1. What the app does

You pick a post format, drop in movie stills, type text, and download Instagram-ready slides. The app has no editing timeline or layers: only the controls each format needs.

- Output size: **1080 × 1350 px (4:5)**, PNG.
- Carousels download as a **zip** with slides numbered `01-cover.png`, `02-…`.
- Default theme color: **#bafeb8** (user's page color). It is changeable, and used for highlighted words, the "SWIPE" tag and the page name.

## 2. Formats (port each renderer from the reference file)

| Format | Slides | Key layout |
|---|---|---|
| **Headline** | Cover + optional clean photo slide | Full photo fading to black from 50% to 71% height. Page logo/name top-left, "SWIPE LEFT ←" top-right (Bebas Neue). Headline in Montserrat 900 caps, centered, auto-fit to the bottom 27%. `*stars*` = accent color. |
| **List** | Cover + one slide per movie + optional follow card | Cover: 2–4 vertical photo panels across the top 72%, huge Montserrat 900 headline, accent "SWIPE" bottom-right. Movie slide: full photo, fade, **title logo PNG** centered (or fallback title text in Montserrat/Anton/Bebas/Cinzel), yellow **IMDb** badge (#F5C518) + rating. |
| **News story** | Cover + story slides + optional follow card | Cover: full photo, optional round inset photo top-left with white border, headline where **each line is scaled to fill the full width**. Story slide: photo top 74%, black bottom with centered Montserrat 800 caps paragraphs. |
| **Timeline** | 1 slide | 2–5 horizontal photo rows stacked, title logo (or Cinzel title) on the left, year (Montserrat 900) on the right. |
| **Follow card** | 1 slide (also appended to List/News) | Dark textured background, Instagram-style profile card (avatar with IG gradient ring, name, blue tick, posts/followers/following, bio, link), Anton caps headline below with each line stretched to width. |

## 3. Editor behaviour (keep all of these)

- Top bar: format tabs, **Brand & profile** button, **Download post** button.
- Left: big preview + slide strip (thumbnails, click to select, "+ Add movie" / "+ Add story slide").
- Right panel: fields for the selected slide only.
- Image boxes accept **click, drag-and-drop and Ctrl+V paste**.
- On the preview: **drag to reposition** the photo under the pointer, **scroll to zoom** (1×–3×). There's a zoom slider and "Reset position" too.
- List/News slides: move earlier/later, delete.
- `*stars*` in any text = accent-colored words.
- Brand settings (page name, logo, accent, avatar, display name, tick, stats, bio, link, follow headline) persist across sessions.
- Wait for fonts to load (`document.fonts.load`) before rendering canvases.

## 4. Suggested project structure

```
app/
  page.tsx                 # editor screen (client component)
  api/movie/route.ts       # phase 3: TMDB/OMDb lookup (server only)
components/
  TopBar.tsx  FormatTabs.tsx  Preview.tsx  SlideStrip.tsx
  panels/ HeadlinePanel.tsx ListPanel.tsx NewsPanel.tsx TimelinePanel.tsx FollowPanel.tsx BrandPanel.tsx
  fields/ ImageSlot.tsx TextField.tsx Toggle.tsx ColorField.tsx
lib/
  render/ index.ts headline.ts list.ts news.ts timeline.ts follow.ts helpers.ts   # pure canvas code, no React
  export.ts                # PNG + zip (use jszip)
  store.ts                 # zustand store; brand persisted with persist middleware
types/post.ts
```

- Keep **all canvas drawing in `lib/render`** as pure functions `(ctx, state, slide) => regions`, so they're easy to test and reuse.
- State: **zustand** (brand slice persisted to localStorage, post slices in memory).
- Fonts: load Montserrat (800, 900), Anton, Bebas Neue, Cinzel (700) and Archivo via `next/font/google`, and expose their family names to the canvas.
- Use **jszip** + a normal `<a download>` for exports (the reference's custom zip code was only needed inside the Claude sandbox).

## 5. Phases

1. **Port**: set up Next.js + Tailwind + zustand, port the five renderers, and get the preview and download working. Make the output match the reference pixel for pixel.
2. **Polish**: drafts saved to IndexedDB (images included) so posts survive a refresh, keyboard shortcuts (←/→ switch slides), and duplicating a slide.
3. **Auto movie data** (the reference couldn't do this): a server route using the **TMDB API** (search → backdrops and title **logos** as transparent PNGs) and the **OMDb API** (IMDb rating). On a movie slide, a user types a title, picks a still and logo from a grid, and the rating fills in. Keep API keys in `.env.local` (`TMDB_API_KEY`, `OMDB_API_KEY`), never in client code.

## 6. Out of scope for now

No video or reels, no accounts or login, no posting straight to Instagram.
