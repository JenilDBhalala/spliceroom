import { useMemo } from "react";
import { create } from "zustand";
import { persist, type PersistStorage, type StorageValue } from "zustand/middleware";
import type {
  Brand, FormatId, Framing, ImageSlot, Lesson, ListItem, Posts, SlotPath, Story, TimelineRow,
} from "@/types/post";
import { readImageFile } from "@/lib/images";
import { slidesFor } from "@/lib/render";

/* ---------- slot factories ---------- */

let phSeed = 0;
let uid = 0;
const nextId = () => `n${uid++}`;

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

const defaultPosts = (): Posts => ({
  headline: {
    img: slot("photo"),
    cleanAdj: { zoom: 1, ox: 0, oy: 0 },
    text: "David Fincher hid a Starbucks cup in *almost every scene* of Fight Club.",
    logo: true,
    swipe: true,
    clean: true,
  },
  list: {
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
    rows: [
      row("row 1", "The Mummy", "1999"),
      row("row 2", "The Mummy Returns", "2001"),
      row("row 3", "Tomb of the Dragon Emperor", "2008"),
      row("row 4", "The Mummy", "2027"),
    ],
  },
  // After timeline so earlier formats keep the reference's placeholder seeds.
  lessons: {
    img: slot("cover photo"),
    logo: logoSlot(),
    kicker: "Lessons I learned from",
    title: "Dead Poets Society",
    brandLogo: true,
    swipe: true,
    numbered: true,
    follow: true,
    lessons: [
      lesson("lesson 1", "Seize the day", '"Carpe diem. Seize the day, boys. *Make your lives extraordinary.*"\n\nStop waiting for the perfect moment. It is not coming.'),
      lesson("lesson 2", "Look at things differently", "Keating has his students stand on the desk to see the room from above. *Change your angle* and the same problem looks new."),
      lesson("lesson 3", "Words can change the world", "Poetry, beauty, romance, love: these are *what we stay alive for*. Read widely and say what you mean."),
      lesson("lesson 4", "Find your own voice", "The longer you wait to *think for yourself*, the harder it gets. Do not let the crowd choose your path."),
    ],
  },
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
  sel: number;
  mode: "slide" | "brand";
  /** Image box the user last touched; Ctrl+V pastes into it. */
  activeSlot: SlotPath | null;
  toast: { msg: string; at: number } | null;

  /** Shallow-merge `patch` into the object at `path` (rooted at "brand" or "posts"). */
  update: (path: SlotPath, patch: object) => void;
  setImage: (path: SlotPath, src: string | null) => void;
  resetFraming: (path: SlotPath) => void;
  setFmt: (fmt: FormatId) => void;
  select: (i: number) => void;
  setMode: (mode: "slide" | "brand") => void;
  setActiveSlot: (path: SlotPath | null) => void;
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

const BRAND_FIELDS = ["name", "accent", "display", "verified", "posts", "followers", "following", "bio", "link", "cta", "exportScale"] as const;
type PersistedBrand = Pick<Brand, (typeof BRAND_FIELDS)[number]> & { logo: string | null; avatar: string | null };
type Persisted = { brand: PersistedBrand };

// localStorage writes are debounced; images are dropped if they exceed the quota.
let saveTimer: ReturnType<typeof setTimeout> | undefined;
const brandStorage: PersistStorage<Persisted> = {
  getItem: (name) => {
    try {
      const raw = localStorage.getItem(name);
      return raw ? (JSON.parse(raw) as StorageValue<Persisted>) : null;
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(name, JSON.stringify(value));
      } catch {
        try {
          const b = value.state.brand;
          localStorage.setItem(name, JSON.stringify({ ...value, state: { brand: { ...b, logo: null, avatar: null } } }));
          useEditor.getState().showToast("Logo images are too large to remember. Text settings were saved.");
        } catch {}
      }
    }, 400);
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {}
  },
};

export const useEditor = create<EditorState>()(
  persist(
    (set, get) => ({
      brand: defaultBrand(),
      posts: defaultPosts(),
      fmt: "headline",
      sel: 0,
      mode: "slide",
      activeSlot: null,
      toast: null,

      update: (path, patch) => {
        const [root, ...rest] = path;
        if (root !== "brand" && root !== "posts") return;
        set({ [root]: setIn(get()[root], rest, patch) } as Partial<EditorState>);
      },
      setImage: (path, src) => get().update(path, { src, zoom: 1, ox: 0, oy: 0 }),
      resetFraming: (path) => get().update(path, { zoom: 1, ox: 0, oy: 0 } satisfies Framing),
      setFmt: (fmt) => set({ fmt, sel: 0, mode: "slide" }),
      select: (sel) => set({ sel, mode: "slide" }),
      setMode: (mode) => set({ mode }),
      setActiveSlot: (activeSlot) => set({ activeSlot }),
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
      name: "spliceroom.brand.v1",
      storage: brandStorage,
      partialize: (s): Persisted => {
        const b = s.brand;
        const brand = Object.fromEntries(BRAND_FIELDS.map((k) => [k, b[k]])) as Pick<Brand, (typeof BRAND_FIELDS)[number]>;
        return { brand: { ...brand, logo: b.logo.src, avatar: b.avatar.src } };
      },
      merge: (persisted, current) => {
        const d = (persisted as Persisted | undefined)?.brand;
        if (!d) return current;
        const brand = { ...current.brand };
        for (const k of BRAND_FIELDS) if (d[k] !== undefined) (brand as Record<string, unknown>)[k] = d[k];
        if (d.logo) brand.logo = { ...brand.logo, src: d.logo };
        if (d.avatar) brand.avatar = { ...brand.avatar, src: d.avatar };
        return { ...current, brand };
      },
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
