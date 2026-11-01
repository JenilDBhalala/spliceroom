export type FormatId =
  | "custom"
  | "headline"
  | "list"
  | "news"
  | "lessons"
  | "timeline"
  | "poster"
  | "meme"
  | "tweet"
  | "quote"
  | "compare"
  | "follow";

/** Output shape: portrait feed post, square post, or story / reel cover. */
export type PostSize = "portrait" | "square" | "story";

/** Slide size in layout units (always 1080 wide). */
export interface Frame {
  W: number;
  H: number;
}

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

export type FontKey =
  | "Montserrat"
  | "Anton"
  | "Bebas Neue"
  | "Oswald"
  | "Archivo Black"
  | "Poppins"
  | "Archivo"
  | "Space Grotesk"
  | "Courier Prime"
  | "Playfair Display"
  | "DM Serif Display"
  | "Abril Fatface"
  | "Cinzel"
  | "Permanent Marker"
  | "Caveat"
  | "Pacifico"
  | "Lobster"
  | "Dancing Script"
  | "Bangers"
  | "Press Start 2P"
  | "Creepster";
/** Kept for list movie titles, which pick from the same fonts. */
export type TitleFont = FontKey;

/** Look of a template's main text; every template has one. */
export interface TextStyle {
  font: FontKey;
  color: string;
  /** Highlight color for *starred* words; null = the brand theme color. */
  accent: string | null;
  /** Text size multiplier, 0.4–1.3. */
  scale: number;
  caps: boolean;
  /** Font weight; null = the font's default (usually its boldest look). */
  weight: number | null;
  /** Extra letter spacing as a fraction of the font size (0 = normal). */
  tracking: number;
  /** Line spacing multiplier (1 = the template's normal spacing). */
  leading: number;
}

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
  /** Download size: 1 = 1080 wide, 2 = 2160 wide. */
  exportScale: 1 | 2;
}

export interface HeadlinePost {
  style: TextStyle;
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
  style: TextStyle;
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
  style: TextStyle;
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
  style: TextStyle;
  img: ImageSlot;
  /** Optional transparent PNG of the movie title, replacing the title text. */
  logo: ImageSlot;
  kicker: string;
  title: string;
  brandLogo: boolean;
  swipe: boolean;
  /** Lesson number above each title: big, compact, or not shown. */
  numbers: "large" | "small" | "off";
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
  style: TextStyle;
  rows: TimelineRow[];
}

export interface PosterPost {
  style: TextStyle;
  img: ImageSlot;
  logo: ImageSlot;
  /** Names across the top, e.g. the cast. */
  top: string;
  tagline: string;
  title: string;
  date: string;
  credits: string;
}

export interface MemePost {
  style: TextStyle;
  /** classic: text on the photo; caption: white bar above the photo. */
  mode: "classic" | "caption";
  /** Caption bar color in caption mode. */
  bar: "light" | "dark";
  img: ImageSlot;
  top: string;
  bottom: string;
  caption: string;
  watermark: boolean;
}

export interface TweetPost {
  style: TextStyle;
  theme: "dark" | "light";
  background: string;
  /** Use the brand's display name, handle, avatar and tick. */
  useBrand: boolean;
  name: string;
  handle: string;
  avatar: ImageSlot;
  verified: boolean;
  text: string;
  img: ImageSlot;
  showImage: boolean;
  /** Image shape: auto fits the space; the others set the height from the card width. */
  imgShape: "auto" | "wide" | "square" | "tall" | "original";
  /** Show the current local time and date instead of `date`. */
  autoDate: boolean;
  date: string;
}

export interface QuotePost {
  style: TextStyle;
  img: ImageSlot;
  usePhoto: boolean;
  background: string;
  quote: string;
  author: string;
  source: string;
  watermark: boolean;
}

export interface ComparePost {
  style: TextStyle;
  layout: "side" | "stack";
  headline: string;
  left: ImageSlot;
  right: ImageSlot;
  leftLabel: string;
  rightLabel: string;
  vs: boolean;
}

/** A free-form text block on the blank canvas. Position is its center, as a fraction of the slide. */
export interface TextLayer {
  kind: "text";
  id: string;
  x: number;
  y: number;
  text: string;
  font: FontKey;
  /** Font size in layout units (the slide is 1080 wide). */
  size: number;
  /** Font weight; null = the font's default. */
  weight: number | null;
  /** Extra letter spacing as a fraction of the font size. */
  tracking: number;
  /** Line spacing multiplier. */
  leading: number;
  color: string;
  /** Color for *starred* words; null = brand theme color. */
  accent: string | null;
  align: "left" | "center" | "right";
  caps: boolean;
  /** Wrapping width as a fraction of the slide width. */
  width: number;
  effect: "none" | "outline" | "shadow" | "box";
  /** Outline, shadow or box color. */
  effectColor: string;
}

/** A photo placed on the blank canvas. */
export interface ImageLayer {
  kind: "image";
  id: string;
  x: number;
  y: number;
  img: ImageSlot;
  /** Width as a fraction of the slide width. */
  w: number;
  /** "free" keeps the photo's own shape; the others crop it. */
  crop: "free" | "square" | "wide" | "tall";
  shape: "rect" | "rounded" | "circle";
  border: boolean;
}

export type Layer = TextLayer | ImageLayer;

export interface CustomPost {
  bg: "photo" | "color" | "gradient";
  bgImg: ImageSlot;
  bgColor: string;
  gradient: [string, string];
  /** Darkening over a photo background, 0–0.8. */
  darken: number;
  layers: Layer[];
}

export interface FollowPost {
  style: TextStyle;
}

export interface Posts {
  custom: CustomPost;
  headline: HeadlinePost;
  list: ListPost;
  news: NewsPost;
  lessons: LessonsPost;
  timeline: TimelinePost;
  poster: PosterPost;
  meme: MemePost;
  tweet: TweetPost;
  quote: QuotePost;
  compare: ComparePost;
  follow: FollowPost;
}

/** Templates with one main text style (every template but the blank canvas). */
export type StyledKey = Exclude<keyof Posts, "custom">;

export type SlideKind =
  | "custom"
  | "hlCover"
  | "hlClean"
  | "listCover"
  | "listItem"
  | "newsCover"
  | "newsStory"
  | "lessonsCover"
  | "lessonItem"
  | "timeline"
  | "poster"
  | "meme"
  | "tweet"
  | "quote"
  | "compare"
  | "follow";

export interface Slide {
  kind: SlideKind;
  label: string;
  /** Index into list items / news stories / lessons. */
  i?: number;
}

/** Path into editor state, e.g. ["posts", "list", "items", 0, "img"]. */
export type SlotPath = readonly (string | number)[];

/** A draggable photo area on a rendered slide (layout units). */
export interface Region {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Framing to adjust when dragging or zooming. */
  path: SlotPath;
  /** Slot holding the image, when it differs from `path` (the clean slide). */
  imgPath?: SlotPath;
  /** A canvas layer: dragging moves it (x/y at `path`), zooming resizes this field. */
  layer?: { id: string; resize: "size" | "w" };
}

export interface RenderState {
  brand: Brand;
  posts: Posts;
  frame: Frame;
}
