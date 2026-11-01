import { useMemo } from "react";
import { create } from "zustand";
import { persist, type PersistStorage, type StorageValue } from "zustand/middleware";
import type {
  Brand, CustomPost, FormatId, Framing, ImageLayer, ImageSlot, Layer, Lesson, ListItem, PostSize, Posts, RenderState, SlotPath, Story,
  StyledKey, TextLayer, TextStyle, TimelineRow,
} from "@/types/post";
import { idbDel, idbGet, idbSet } from "@/lib/db";
import { readImageFile } from "@/lib/images";
import { FRAMES, slidesFor } from "@/lib/render";

/* ---------- slot factories ---------- */

let phSeed = 0;
let uid = 0;
// Time-based so ids stay unique next to items restored from an earlier visit.
const nextId = () => `${Date.now().toString(36)}-${uid++}`;

export const slot = (label: string, opts: { noPH?: boolean } = {}): ImageSlot => ({
  src: null,
  ph: opts.noPH ? null : { seed: phSeed++, label },
  zoom: 1,
  ox: 0,
  oy: 0,
});
const logoSlot = () => slot("title logo", { noPH: true });

const listItem = (label: string, rest: Partial<ListItem> = {}): ListItem => ({
  id: nextId(), img: slot(label), logo: logoSlot(), title: "", font: "Montserrat", color: "#ffffff", rating: "", showRating: true, ...rest,
});
const story = (label: string, text = ""): Story => ({ id: nextId(), img: slot(label), text });
const lesson = (label: string, title = "", text = ""): Lesson => ({ id: nextId(), img: slot(label), title, text });
const row = (label: string, title = "", year = ""): TimelineRow => ({ id: nextId(), img: slot(label), logo: logoSlot(), title, year });

/* ---------- defaults (same opening state as the reference) ---------- */

const defaultBrand = (): Brand => ({
  name: "yourpage",
  logo: slot("logo", { noPH: true }),
  accent: "#bafeb8",
  avatar: slot("avatar", { noPH: true }),
  display: "YOURPAGE",
  verified: true,
  posts: "1,240",
  followers: "86.4K",
  following: "112",
  bio: "▷ Daily cinema news, lists and trivia\n✉ hello@yourpage.com\n⇩ New post every day",
  link: "linktr.ee/yourpage",
  cta: "If you love movies and want to keep up with the latest cinema news, you should follow us right now",
  exportScale: 2,
});

/* ---------- text styles ---------- */

const style = (font: TextStyle["font"], color = "#ffffff", caps = true): TextStyle => ({ font, color, accent: null, scale: 1, caps });

/** Each template's starting style; "Reset style" goes back to these. */
export const DEFAULT_STYLES: Record<StyledKey, TextStyle> = {
  headline: style("Montserrat"),
  list: style("Montserrat"),
  news: style("Montserrat"),
  lessons: style("Montserrat"),
  timeline: style("Cinzel", "#f1e4c4"),
  poster: style("Bebas Neue"),
  meme: style("Anton"),
  tweet: style("Archivo", "#e7e9ea", false),
  quote: style("Playfair Display", "#ffffff", false),
  compare: style("Montserrat"),
  follow: style("Anton"),
};
const CAPTION_TEXT = { light: "#111111", dark: "#ffffff" } as const;
const captionStyle = (bar: "light" | "dark") => style("Archivo", CAPTION_TEXT[bar], false);
const TWEET_LIGHT = { color: "#0f1419", background: "#ffffff" };
const TWEET_DARK = { color: "#e7e9ea", background: "#000000" };
const sameStyle = (a: TextStyle, b: TextStyle) => (Object.keys(a) as (keyof TextStyle)[]).every((k) => a[k] === b[k]);

/* ---------- blank canvas ---------- */

export const textLayer = (o: Partial<TextLayer> = {}): TextLayer => ({
  kind: "text",
  id: nextId(),
  x: 0.5,
  y: 0.5,
  text: "Your text",
  font: "Anton",
  size: 110,
  color: "#ffffff",
  accent: null,
  align: "center",
  caps: true,
  width: 0.9,
  effect: "outline",
  effectColor: "#000000",
  ...o,
});

export const imageLayer = (label = "photo", o: Partial<ImageLayer> = {}): ImageLayer => ({
  kind: "image",
  id: nextId(),
  x: 0.5,
  y: 0.5,
  img: slot(label),
  w: 0.6,
  crop: "free",
  shape: "rounded",
  border: false,
  ...o,
});

const canvas = (o: Partial<CustomPost>): CustomPost => ({
  bg: "photo",
  bgImg: slot("background"),
  bgColor: "#111311",
  gradient: ["#0f2027", "#2c5364"],
  darken: 0,
  layers: [],
  ...o,
});

const plain = { effect: "none" as const, caps: false };

/** One-tap starting layouts for the blank canvas. Positions are fractions, so they work at every size. */
export const CANVAS_PRESETS: { id: string; name: string; make: () => CustomPost }[] = [
  {
    id: "classic",
    name: "Classic meme",
    make: () =>
      canvas({
        layers: [
          textLayer({ y: 0.11, text: "When you finally" }),
          textLayer({ y: 0.89, text: "understand the *ending*" }),
        ],
      }),
  },
  {
    id: "caption",
    name: "Caption meme",
    make: () =>
      canvas({
        bg: "color",
        bgColor: "#ffffff",
        layers: [
          textLayer({ ...plain, y: 0.12, text: "Me pretending I understood Tenet the first time", font: "Archivo", size: 58, color: "#111111", align: "left", width: 0.88 }),
          imageLayer("meme photo", { y: 0.62, w: 1, crop: "square", shape: "rect" }),
        ],
      }),
  },
  {
    id: "demotivational",
    name: "Demotivational",
    make: () =>
      canvas({
        bg: "color",
        bgColor: "#000000",
        layers: [
          imageLayer("photo", { y: 0.38, w: 0.8, crop: "wide", shape: "rect", border: true }),
          textLayer({ ...plain, y: 0.75, text: "Plot twist", font: "DM Serif Display", size: 120, caps: true }),
          textLayer({ ...plain, y: 0.85, text: "Sometimes the villain was right all along.", font: "Archivo", size: 40, color: "#d6d6d6" }),
        ],
      }),
  },
  {
    id: "two-panel",
    name: "Two-panel meme",
    make: () =>
      canvas({
        bg: "color",
        bgColor: "#ffffff",
        layers: [
          imageLayer("top photo", { x: 0.26, y: 0.27, w: 0.5, crop: "square", shape: "rect" }),
          imageLayer("bottom photo", { x: 0.26, y: 0.73, w: 0.5, crop: "square", shape: "rect" }),
          textLayer({ ...plain, x: 0.76, y: 0.27, text: "Reading the book", font: "Archivo", size: 56, color: "#111111", width: 0.42 }),
          textLayer({ ...plain, x: 0.76, y: 0.73, text: "Waiting 3 years for the *movie*", font: "Archivo", size: 56, color: "#111111", width: 0.42 }),
        ],
      }),
  },
  {
    id: "title-card",
    name: "Movie title card",
    make: () =>
      canvas({
        darken: 0.35,
        layers: [
          textLayer({ y: 0.08, text: "A Christopher Nolan film", font: "Oswald", size: 40, effect: "none" }),
          textLayer({ y: 0.74, text: "Interstellar", font: "Bebas Neue", size: 210, effect: "shadow", effectColor: "#000000" }),
          textLayer({ ...plain, y: 0.88, text: "Mankind was born on Earth. It was never meant to die here.", font: "Archivo", size: 38, color: "#e6e6e6", width: 0.8 }),
        ],
      }),
  },
  {
    id: "quote",
    name: "Quote",
    make: () =>
      canvas({
        bg: "gradient",
        layers: [
          textLayer({ ...plain, y: 0.45, text: "Make your lives extraordinary", font: "Pacifico", size: 100, width: 0.84 }),
          textLayer({ ...plain, y: 0.66, text: "John Keating", font: "Oswald", size: 40, caps: true, color: "#bafeb8" }),
        ],
      }),
  },
];

const defaultPosts = (): Posts => ({
  headline: {
    style: DEFAULT_STYLES.headline,
    img: slot("photo"),
    cleanAdj: { zoom: 1, ox: 0, oy: 0 },
    text: "David Fincher hid a Starbucks cup in *almost every scene* of Fight Club.",
    logo: true,
    swipe: true,
    clean: true,
  },
  list: {
    style: DEFAULT_STYLES.list,
    panels: [slot("panel 1"), slot("panel 2"), slot("panel 3")],
    panelCount: 3,
    text: "Every major video game adaptation",
    swipe: true,
    follow: false,
    items: [
      listItem("movie 1", { title: "Fallout", rating: "8.3" }),
      listItem("movie 2", { title: "THE LAST OF US", font: "Bebas Neue", rating: "8.6" }),
      listItem("movie 3", { title: "Warcraft", font: "Cinzel", color: "#d9d9d9", rating: "6.7" }),
    ],
  },
  news: {
    style: DEFAULT_STYLES.news,
    img: slot("cover photo"),
    inset: slot("inset photo"),
    insetOn: true,
    text: "The Odyssey\nwas shot entirely\non IMAX\nfilm cameras",
    swipe: true,
    follow: true,
    stories: [
      story("story 1", "Christopher Nolan shot every scene with IMAX 70mm film cameras.\n\nNo feature film had been made that way before."),
      story("story 2", '"*It was the only way* to put the audience inside the myth."\n\nNolan, on choosing the format.'),
    ],
  },
  timeline: {
    style: DEFAULT_STYLES.timeline,
    rows: [
      row("row 1", "The Mummy", "1999"),
      row("row 2", "The Mummy Returns", "2001"),
      row("row 3", "Tomb of the Dragon Emperor", "2008"),
      row("row 4", "The Mummy", "2027"),
    ],
  },
  // After timeline so earlier formats keep the reference's placeholder seeds.
  lessons: {
    style: DEFAULT_STYLES.lessons,
    img: slot("cover photo"),
    logo: logoSlot(),
    kicker: "Lessons I learned from",
    title: "Dead Poets Society",
    brandLogo: true,
    swipe: true,
    numbers: "small",
    follow: true,
    lessons: [
      lesson("lesson 1", "Seize the day", '"Carpe diem. Seize the day, boys. *Make your lives extraordinary.*"\n\nStop waiting for the perfect moment. It is not coming.'),
      lesson("lesson 2", "Look at things differently", "Keating has his students stand on the desk to see the room from above. *Change your angle* and the same problem looks new."),
      lesson("lesson 3", "Words can change the world", "Poetry, beauty, romance, love: these are *what we stay alive for*. Read widely and say what you mean."),
      lesson("lesson 4", "Find your own voice", "The longer you wait to *think for yourself*, the harder it gets. Do not let the crowd choose your path."),
    ],
  },
  poster: {
    style: DEFAULT_STYLES.poster,
    img: slot("poster photo"),
    logo: logoSlot(),
    top: "Robin Williams",
    tagline: "He was their inspiration. He made their lives *extraordinary*.",
    title: "Dead Poets Society",
    date: "In cinemas June 2",
    credits:
      "Touchstone Pictures presents in association with Silver Screen Partners IV a Steven Haft production a Peter Weir film Robin Williams Dead Poets Society written by Tom Schulman directed by Peter Weir",
  },
  meme: {
    style: DEFAULT_STYLES.meme,
    mode: "classic",
    bar: "light",
    img: slot("meme photo"),
    top: "When the trailer",
    bottom: "shows the *whole movie*",
    caption: "Me explaining the ending of Inception to people who did not ask",
    watermark: true,
  },
  tweet: {
    style: DEFAULT_STYLES.tweet,
    theme: "dark",
    background: TWEET_DARK.background,
    useBrand: true,
    name: "Movie Buff",
    handle: "moviebuff",
    avatar: slot("avatar", { noPH: true }),
    verified: false,
    text: "Dead Poets Society came out in 1989 and it still teaches more about life than *most of school did*.",
    img: slot("post image"),
    showImage: true,
    date: "9:41 AM · Oct 31, 2026",
  },
  quote: {
    style: DEFAULT_STYLES.quote,
    img: slot("quote photo"),
    usePhoto: true,
    background: "#111311",
    quote: "No matter what anybody tells you, *words and ideas* can change the world.",
    author: "John Keating",
    source: "Dead Poets Society (1989)",
    watermark: true,
  },
  compare: {
    style: DEFAULT_STYLES.compare,
    layout: "side",
    headline: "Which one is *better*?",
    left: slot("left photo"),
    right: slot("right photo"),
    leftLabel: "Original",
    rightLabel: "Remake",
    vs: true,
  },
  follow: { style: DEFAULT_STYLES.follow },
  // Last so earlier templates keep their placeholder colors.
  custom: CANVAS_PRESETS[0].make(),
});

/* ---------- immutable path helpers ---------- */

type Obj = Record<string | number, unknown>;

export function getIn<T = unknown>(root: unknown, path: SlotPath): T {
  return path.reduce<unknown>((o, k) => (o as Obj)?.[k], root) as T;
}

function setIn(root: unknown, path: SlotPath, patch: object): unknown {
  if (!path.length) return { ...(root as object), ...patch };
  const [k, ...rest] = path;
  const copy: Obj = Array.isArray(root) ? ([...root] as unknown as Obj) : { ...(root as Obj) };
  copy[k] = setIn(copy[k], rest, patch);
  return copy;
}

/* ---------- store ---------- */

/** Posts whose slides after the cover form a reorderable sequence, and the array holding it. */
type Sequence = "list" | "news" | "lessons";
const SEQUENCE_KEY = { list: "items", news: "stories", lessons: "lessons" } as const;
const sequenceOf = (posts: Posts, which: Sequence): unknown[] =>
  (posts[which] as unknown as Record<string, unknown[]>)[SEQUENCE_KEY[which]];

export interface EditorState {
  brand: Brand;
  posts: Posts;
  fmt: FormatId;
  size: PostSize;
  sel: number;
  mode: "slide" | "brand";
  /** Image box the user last touched; Ctrl+V pastes into it. */
  activeSlot: SlotPath | null;
  /** Selected blank-canvas layer (null = background). */
  layerSel: string | null;
  toast: { msg: string; at: number } | null;

  /** Shallow-merge `patch` into the object at `path` (rooted at "brand" or "posts"). */
  update: (path: SlotPath, patch: object) => void;
  setImage: (path: SlotPath, src: string | null) => void;
  resetFraming: (path: SlotPath) => void;
  setFmt: (fmt: FormatId) => void;
  setSize: (size: PostSize) => void;
  resetStyle: (key: StyledKey) => void;
  /** Put a template back to its sample content (text, photos and style). */
  resetTemplate: (key: keyof Posts) => void;
  /** Switch meme layout; a still-default text style follows the layout's default. */
  setMemeMode: (mode: "classic" | "caption") => void;
  /** Switch caption bar color; a still-default text color follows it. */
  setMemeBar: (bar: "light" | "dark") => void;
  /** Switch tweet theme; text color and background follow if they were the other theme's defaults. */
  setTweetTheme: (theme: "dark" | "light") => void;
  select: (i: number) => void;
  setMode: (mode: "slide" | "brand") => void;
  setActiveSlot: (path: SlotPath | null) => void;
  setLayerSel: (id: string | null) => void;
  addLayer: (kind: Layer["kind"]) => void;
  duplicateLayer: (id: string) => void;
  removeLayer: (id: string) => void;
  /** Move a layer toward the front (+1) or back (-1). */
  restackLayer: (id: string, dir: -1 | 1) => void;
  applyPreset: (presetId: string) => void;
  showToast: (msg: string) => void;

  setPanelCount: (n: 2 | 3 | 4) => void;
  addListItem: () => void;
  addStory: () => void;
  /** Swap item i with i+dir in list items, news stories or lessons, keeping it selected. */
  addLesson: () => void;
  moveItem: (which: Sequence, i: number, dir: -1 | 1) => void;
  deleteItem: (which: Sequence, i: number) => void;
  addTimelineRow: () => void;
  removeTimelineRow: (i: number) => void;
}

/* ---------- saving ---------- */

// Everything you make is saved on this device in IndexedDB (photos included) and restored on the next visit.
const DRAFT_KEY = "editor";
const LEGACY_KEY = "spliceroom.brand.v1"; // brand-only localStorage save from before drafts

type Persisted = { brand: Brand; posts: Posts; size: PostSize; fmt: FormatId };
/** Old localStorage shape: brand text fields with logo/avatar as plain data URLs. */
type LegacyBrand = Partial<Omit<Brand, "logo" | "avatar">> & { logo?: string | ImageSlot | null; avatar?: string | ImageSlot | null };

let saveTimer: ReturnType<typeof setTimeout> | undefined;
let pending: StorageValue<Persisted> | null = null;
let warned = false;

async function flushSave() {
  clearTimeout(saveTimer);
  const value = pending;
  pending = null;
  if (!value) return;
  try {
    await idbSet(DRAFT_KEY, value);
    try {
      localStorage.removeItem(LEGACY_KEY);
    } catch {}
  } catch {
    if (!warned) useEditor.getState().showToast("Couldn't save on this device (private browsing?). Download your post before leaving.");
    warned = true;
  }
}

// Writes are debounced while typing or dragging, and flushed when the tab is hidden or closed.
const draftStorage: PersistStorage<Persisted> = {
  getItem: async () => {
    try {
      const saved = await idbGet<StorageValue<Persisted>>(DRAFT_KEY);
      if (saved) return saved;
    } catch {}
    try {
      const raw = localStorage.getItem(LEGACY_KEY);
      return raw ? (JSON.parse(raw) as StorageValue<Persisted>) : null;
    } catch {
      return null;
    }
  },
  setItem: (_name, value) => {
    pending = value;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(flushSave, 500);
  },
  removeItem: () => idbDel(DRAFT_KEY).catch(() => {}),
};

if (typeof window !== "undefined") {
  addEventListener("pagehide", () => void flushSave());
  document.addEventListener("visibilitychange", () => document.visibilityState === "hidden" && void flushSave());
}

const asSlot = (v: LegacyBrand["logo"], fallback: ImageSlot): ImageSlot =>
  typeof v === "string" ? { ...fallback, src: v } : v && typeof v === "object" ? { ...fallback, ...v } : fallback;

/** Saved data laid over today's defaults, so fields and templates added later get their defaults. */
function mergeSaved(saved: Partial<Persisted> & { brand?: LegacyBrand }, current: EditorState): EditorState {
  const brand: Brand = { ...current.brand };
  if (saved.brand) {
    const { logo, avatar, ...rest } = saved.brand;
    Object.assign(brand, rest);
    brand.logo = asSlot(logo, current.brand.logo);
    brand.avatar = asSlot(avatar, current.brand.avatar);
  }
  const posts = { ...current.posts };
  if (saved.posts) {
    for (const k of Object.keys(current.posts) as (keyof Posts)[]) {
      const sp = saved.posts[k];
      if (!sp) continue;
      const base = current.posts[k];
      const style = "style" in base && "style" in sp ? { style: { ...base.style, ...sp.style } } : {};
      (posts as Record<string, unknown>)[k] = { ...base, ...sp, ...style };
    }
  }
  const size = saved.size && saved.size in FRAMES ? saved.size : current.size;
  const fmt = saved.fmt && saved.fmt in current.posts ? saved.fmt : current.fmt;
  return { ...current, brand, posts, size, fmt };
}

export const useEditor = create<EditorState>()(
  persist(
    (set, get) => ({
      brand: defaultBrand(),
      posts: defaultPosts(),
      fmt: "headline",
      size: "portrait",
      sel: 0,
      mode: "slide",
      activeSlot: null,
      layerSel: null,
      toast: null,

      update: (path, patch) => {
        const [root, ...rest] = path;
        if (root !== "brand" && root !== "posts") return;
        set({ [root]: setIn(get()[root], rest, patch) } as Partial<EditorState>);
      },
      setImage: (path, src) => get().update(path, { src, zoom: 1, ox: 0, oy: 0 }),
      resetFraming: (path) => get().update(path, { zoom: 1, ox: 0, oy: 0 } satisfies Framing),
      setFmt: (fmt) => set({ fmt, sel: 0, mode: "slide", activeSlot: null }),
      setSize: (size) => set({ size }),
      resetStyle: (key) => {
        const meme = get().posts.meme;
        get().update(["posts", key], { style: key === "meme" && meme.mode === "caption" ? captionStyle(meme.bar) : DEFAULT_STYLES[key] });
      },
      resetTemplate: (key) => {
        get().update(["posts"], { [key]: defaultPosts()[key] });
        set({ sel: 0, activeSlot: null });
      },
      setMemeMode: (mode) => {
        const cur = get().posts.meme.style;
        const caption = captionStyle(get().posts.meme.bar);
        const [from, to] = mode === "caption" ? [DEFAULT_STYLES.meme, caption] : [caption, DEFAULT_STYLES.meme];
        get().update(["posts", "meme"], { mode, style: sameStyle(cur, from) ? to : cur });
      },
      setMemeBar: (bar) => {
        const st = get().posts.meme.style;
        const other = bar === "dark" ? "light" : "dark";
        get().update(["posts", "meme"], { bar, style: st.color === CAPTION_TEXT[other] ? { ...st, color: CAPTION_TEXT[bar] } : st });
      },
      setTweetTheme: (theme) => {
        const p = get().posts.tweet;
        const [from, to] = theme === "light" ? [TWEET_DARK, TWEET_LIGHT] : [TWEET_LIGHT, TWEET_DARK];
        get().update(["posts", "tweet"], {
          theme,
          background: p.background === from.background ? to.background : p.background,
          style: p.style.color === from.color ? { ...p.style, color: to.color } : p.style,
        });
      },
      select: (sel) => set({ sel, mode: "slide" }),
      setMode: (mode) => set({ mode }),
      setActiveSlot: (activeSlot) => set({ activeSlot }),
      setLayerSel: (layerSel) => set({ layerSel, mode: "slide" }),
      addLayer: (kind) => {
        const layer = kind === "text" ? textLayer() : imageLayer("new photo", { w: 0.5 });
        get().update(["posts", "custom"], { layers: [...get().posts.custom.layers, layer] });
        set({ layerSel: layer.id, mode: "slide" });
      },
      duplicateLayer: (id) => {
        const layers = get().posts.custom.layers;
        const i = layers.findIndex((l) => l.id === id);
        if (i < 0) return;
        const copy = { ...layers[i], id: nextId(), x: Math.min(0.95, layers[i].x + 0.04), y: Math.min(0.95, layers[i].y + 0.04) } as Layer;
        get().update(["posts", "custom"], { layers: [...layers.slice(0, i + 1), copy, ...layers.slice(i + 1)] });
        set({ layerSel: copy.id });
      },
      removeLayer: (id) => {
        get().update(["posts", "custom"], { layers: get().posts.custom.layers.filter((l) => l.id !== id) });
        set({ layerSel: null, activeSlot: null });
      },
      restackLayer: (id, dir) => {
        const layers = [...get().posts.custom.layers];
        const i = layers.findIndex((l) => l.id === id);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= layers.length) return;
        [layers[i], layers[j]] = [layers[j], layers[i]];
        get().update(["posts", "custom"], { layers });
      },
      applyPreset: (presetId) => {
        const preset = CANVAS_PRESETS.find((p) => p.id === presetId);
        if (!preset) return;
        get().update(["posts"], { custom: preset.make() });
        set({ layerSel: null, activeSlot: null });
      },
      showToast: (msg) => set({ toast: { msg, at: Date.now() } }),

      setPanelCount: (n) => {
        const panels = [...get().posts.list.panels];
        while (panels.length < n) panels.push(slot(`panel ${panels.length + 1}`));
        get().update(["posts", "list"], { panelCount: n, panels });
      },
      addListItem: () => {
        const items = get().posts.list.items;
        get().update(["posts", "list"], { items: [...items, listItem(`movie ${items.length + 1}`)] });
        set({ sel: items.length + 1, mode: "slide" });
      },
      addStory: () => {
        const stories = get().posts.news.stories;
        get().update(["posts", "news"], { stories: [...stories, story(`story ${stories.length + 1}`)] });
        set({ sel: stories.length + 1, mode: "slide" });
      },
      addLesson: () => {
        const lessons = get().posts.lessons.lessons;
        get().update(["posts", "lessons"], { lessons: [...lessons, lesson(`lesson ${lessons.length + 1}`)] });
        set({ sel: lessons.length + 1, mode: "slide" });
      },
      moveItem: (which, i, dir) => {
        const key = SEQUENCE_KEY[which];
        const arr = [...sequenceOf(get().posts, which)];
        const j = i + dir;
        if (j < 0 || j >= arr.length) return;
        [arr[i], arr[j]] = [arr[j], arr[i]];
        get().update(["posts", which], { [key]: arr });
        set({ sel: get().sel + dir });
      },
      deleteItem: (which, i) => {
        const key = SEQUENCE_KEY[which];
        const arr = [...sequenceOf(get().posts, which)];
        if (arr.length <= 1) return;
        arr.splice(i, 1);
        get().update(["posts", which], { [key]: arr });
        set({ sel: Math.max(0, get().sel - 1), activeSlot: null });
      },
      addTimelineRow: () => {
        const rows = get().posts.timeline.rows;
        if (rows.length >= 5) return;
        get().update(["posts", "timeline"], { rows: [...rows, row(`row ${rows.length + 1}`)] });
      },
      removeTimelineRow: (i) => {
        const rows = get().posts.timeline.rows;
        if (rows.length <= 2) return;
        get().update(["posts", "timeline"], { rows: rows.filter((_, k) => k !== i) });
        set({ activeSlot: null });
      },
    }),
    {
      name: DRAFT_KEY,
      storage: draftStorage,
      partialize: (s): Persisted => ({ brand: s.brand, posts: s.posts, size: s.size, fmt: s.fmt }),
      merge: (persisted, current) => (persisted ? mergeSaved(persisted as Partial<Persisted>, current) : current),
    },
  ),
);

/* ---------- hooks and shared actions ---------- */

/** Slides of the current format, with the selection clamped to them. */
export function useSlides() {
  const fmt = useEditor((s) => s.fmt);
  const posts = useEditor((s) => s.posts);
  const rawSel = useEditor((s) => s.sel);
  const slides = useMemo(() => slidesFor(fmt, posts), [fmt, posts]);
  return { slides, sel: Math.min(rawSel, slides.length - 1) };
}

/** Everything a renderer needs: brand, posts and the slide frame for the chosen size. */
export function useRenderState(): RenderState {
  const brand = useEditor((s) => s.brand);
  const posts = useEditor((s) => s.posts);
  const size = useEditor((s) => s.size);
  return useMemo(() => ({ brand, posts, frame: FRAMES[size] }), [brand, posts, size]);
}

export const renderStateOf = (s: EditorState): RenderState => ({ brand: s.brand, posts: s.posts, frame: FRAMES[s.size] });

/** Value of `path.key` plus a setter, for binding form fields. */
export function useField<T>(path: SlotPath, key: string): [T, (v: T) => void] {
  const value = useEditor((s) => getIn<Record<string, T>>(s, path)[key]);
  const update = useEditor((s) => s.update);
  return [value, (v: T) => update(path, { [key]: v })];
}

export async function loadFileInto(path: SlotPath, file: File | null | undefined) {
  const { setImage, showToast } = useEditor.getState();
  if (!file || !file.type.startsWith("image/")) return showToast("That file is not an image. Use JPG, PNG or WebP.");
  try {
    setImage(path, await readImageFile(file));
  } catch {
    showToast("Could not read that image.");
  }
}
