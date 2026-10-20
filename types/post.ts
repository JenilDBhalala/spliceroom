export type FormatId = "headline" | "list" | "news" | "lessons" | "timeline" | "follow";

/** Where a photo sits inside its box: zoom 1–3, offsets -1…1 (0 = centered). */
export interface Framing {
  zoom: number;
  ox: number;
  oy: number;
}

/** Seed + label for a generated placeholder still. */
export interface Placeholder {
  seed: number;
  label: string;
}

/** An image box. `src` is a data URL; the decoded image lives in lib/images. */
export interface ImageSlot extends Framing {
  src: string | null;
  ph: Placeholder | null;
}

export type TitleFont = "Montserrat" | "Anton" | "Bebas Neue" | "Cinzel";

export interface Brand {
  name: string;
  logo: ImageSlot;
  accent: string;
  avatar: ImageSlot;
  display: string;
  verified: boolean;
  posts: string;
  followers: string;
  following: string;
  bio: string;
  link: string;
  cta: string;
  /** Download size: 1 = 1080×1350, 2 = 2160×2700. */
  exportScale: 1 | 2;
}

export interface HeadlinePost {
  img: ImageSlot;
  /** Framing of the same photo on the clean slide. */
  cleanAdj: Framing;
  text: string;
  logo: boolean;
  swipe: boolean;
  clean: boolean;
}

export interface ListItem {
  id: string;
  img: ImageSlot;
  logo: ImageSlot;
  title: string;
  font: TitleFont;
  color: string;
  rating: string;
  showRating: boolean;
}

export interface ListPost {
  panels: ImageSlot[];
  panelCount: 2 | 3 | 4;
  text: string;
  swipe: boolean;
  follow: boolean;
  items: ListItem[];
}

export interface Story {
  id: string;
  img: ImageSlot;
  text: string;
}

export interface NewsPost {
  img: ImageSlot;
  inset: ImageSlot;
  insetOn: boolean;
  text: string;
  swipe: boolean;
  follow: boolean;
  stories: Story[];
}

export interface Lesson {
  id: string;
  img: ImageSlot;
  title: string;
  text: string;
}

export interface LessonsPost {
  img: ImageSlot;
  /** Optional transparent PNG of the movie title, replacing the title text. */
  logo: ImageSlot;
  kicker: string;
  title: string;
  brandLogo: boolean;
  swipe: boolean;
  numbered: boolean;
  follow: boolean;
  lessons: Lesson[];
}

export interface TimelineRow {
  id: string;
  img: ImageSlot;
  logo: ImageSlot;
  title: string;
  year: string;
}

export interface TimelinePost {
  rows: TimelineRow[];
}

export interface Posts {
  headline: HeadlinePost;
  list: ListPost;
  news: NewsPost;
  lessons: LessonsPost;
  timeline: TimelinePost;
}

export type SlideKind =
  | "hlCover"
  | "hlClean"
  | "listCover"
  | "listItem"
  | "newsCover"
  | "newsStory"
  | "lessonsCover"
  | "lessonItem"
  | "timeline"
  | "follow";

export interface Slide {
  kind: SlideKind;
  label: string;
  /** Index into list items / news stories / lessons. */
  i?: number;
}

/** Path into editor state, e.g. ["posts", "list", "items", 0, "img"]. */
export type SlotPath = readonly (string | number)[];

/** A draggable photo area on a rendered slide (canvas pixels). */
export interface Region {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Framing to adjust when dragging or zooming. */
  path: SlotPath;
  /** Slot holding the image, when it differs from `path` (the clean slide). */
  imgPath?: SlotPath;
}

export interface RenderState {
  brand: Brand;
  posts: Posts;
}
