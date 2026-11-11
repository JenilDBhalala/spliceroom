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
  | "follow"
  | "scene";

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

/** Photo adjustments, like a photo app's: 1 (or 0 / false) means unchanged. */
export interface PhotoFx {
  opacity?: number;
  brightness?: number;
  contrast?: number;
  saturate?: number;
  /** Black and white amount, 0–1. */
  gray?: number;
  /** Blur radius in layout units. */
  blur?: number;
  flip?: boolean;
}

/** An image box. `src` is a data URL; the decoded image lives in lib/images. */
export interface ImageSlot extends Framing {
  src: string | null;
  ph: Placeholder | null;
  fx?: PhotoFx;
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
  /** Text effect; unset = the template's own (memes: a black outline). */
  effect?: TextEffect;
  /** Outline, shadow, glow or box color. */
  effectColor?: string;
  /** Outline thickness as a fraction of the font size. */
  stroke?: number;
}

export type TextEffect = "none" | "outline" | "shadow" | "glow" | "box";

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
  /** How the page name shows on posts; unset = the logo when there is one, else @handle. */
  markAs?: "handle" | "name" | "logo";
}

export interface HeadlinePost {
  /** Show @pagename in a corner. */
  watermark?: boolean;
  /** Text, photos and stickers added on top, per slide (see `Slide.own`). */
  extras?: Extras;
  /** Text blocks the user dragged or resized on the preview. */
  moves?: TextMoves;
  /** Text blocks the user restyled one by one. */
  looks?: TextLooks;
  style: TextStyle;
  img: ImageSlot;
  /** Framing of the same photo on the clean slide. */
  cleanAdj: Framing;
  text: string;
  /** Small label above the headline, e.g. BREAKING; empty = hidden. */
  tag?: string;
  /** Credit line under the headline, e.g. "Source: Variety"; empty = hidden. */
  source?: string;
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
  /** Small line under the title, e.g. "2024 · Drama"; empty = hidden. */
  meta?: string;
}

export interface ListPost {
  /** Show @pagename in a corner. */
  watermark?: boolean;
  /** Text, photos and stickers added on top, per slide (see `Slide.own`). */
  extras?: Extras;
  /** Text blocks the user dragged or resized on the preview. */
  moves?: TextMoves;
  /** Text blocks the user restyled one by one. */
  looks?: TextLooks;
  style: TextStyle;
  panels: ImageSlot[];
  panelCount: 2 | 3 | 4;
  /** How every movie's rating shows; unset = IMDb. */
  ratingKind?: "imdb" | "tomato" | "stars" | "text";
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
  /** Show @pagename in a corner. */
  watermark?: boolean;
  /** Text, photos and stickers added on top, per slide (see `Slide.own`). */
  extras?: Extras;
  /** Text blocks the user dragged or resized on the preview. */
  moves?: TextMoves;
  /** Text blocks the user restyled one by one. */
  looks?: TextLooks;
  style: TextStyle;
  img: ImageSlot;
  inset: ImageSlot;
  insetOn: boolean;
  /** Cover headline: each line stretched to the full width, or every line the same size; unset = stretched. */
  coverStyle?: "stretch" | "even";
  /** Layout of the cover and story slides; unset = full photo. */
  design?: "photo" | "band" | "frame";
  /** Headline options from "Make it from a news link", to switch between. */
  headlines?: string[];
  /** Photos found for the story (links only), to put on any slide. */
  found?: { url: string; from: string }[];
  text: string;
  /** Small label above the headline, e.g. BREAKING; empty = hidden. */
  tag?: string;
  /** Credit line under the headline, e.g. "Source: Variety"; empty = hidden. */
  source?: string;
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
  /** Show @pagename in a corner. */
  watermark?: boolean;
  /** Text, photos and stickers added on top, per slide (see `Slide.own`). */
  extras?: Extras;
  /** Text blocks the user dragged or resized on the preview. */
  moves?: TextMoves;
  /** Text blocks the user restyled one by one. */
  looks?: TextLooks;
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
  /** Show @pagename in a corner. */
  watermark?: boolean;
  /** Text, photos and stickers added on top, per slide (see `Slide.own`). */
  extras?: Extras;
  /** Text blocks the user dragged or resized on the preview. */
  moves?: TextMoves;
  /** Text blocks the user restyled one by one. */
  looks?: TextLooks;
  style: TextStyle;
  rows: TimelineRow[];
}

export interface PosterPost {
  /** Show @pagename in a corner. */
  watermark?: boolean;
  /** Text, photos and stickers added on top, per slide (see `Slide.own`). */
  extras?: Extras;
  /** Text blocks the user dragged or resized on the preview. */
  moves?: TextMoves;
  /** Text blocks the user restyled one by one. */
  looks?: TextLooks;
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
  /** Text, photos and stickers added on top, per slide (see `Slide.own`). */
  extras?: Extras;
  /** Text blocks the user dragged or resized on the preview. */
  moves?: TextMoves;
  /** Text blocks the user restyled one by one. */
  looks?: TextLooks;
  style: TextStyle;
  /** classic: text on the photo; caption: white bar above the photo. */
  mode: "classic" | "caption";
  /** Caption bar shade in caption mode (kept for drafts from before `barColor`). */
  bar: "light" | "dark";
  /** Caption bar color; unset = white or black from `bar`. */
  barColor?: string;
  /** Caption above or below the photo; unset = above. */
  captionAt?: "top" | "bottom";
  /** Space around the photo in the bar color, in caption mode. */
  pad?: "none" | "small" | "large";
  img: ImageSlot;
  top: string;
  bottom: string;
  caption: string;
  watermark: boolean;
}

export interface TweetPost {
  /** Show @pagename in a corner. */
  watermark?: boolean;
  /** Text, photos and stickers added on top, per slide (see `Slide.own`). */
  extras?: Extras;
  /** Text blocks the user dragged or resized on the preview. */
  moves?: TextMoves;
  /** Text blocks the user restyled one by one. */
  looks?: TextLooks;
  style: TextStyle;
  theme: "dark" | "light" | "dim";
  background: string;
  /** Tick color; unset = blue. */
  badge?: "blue" | "gold" | "grey";
  /** Counts under the post, as typed ("12400" shows as 12.4K); empty ones are hidden. */
  views?: string;
  reposts?: string;
  likes?: string;
  bookmarks?: string;
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
  /** Text, photos and stickers added on top, per slide (see `Slide.own`). */
  extras?: Extras;
  /** Text blocks the user dragged or resized on the preview. */
  moves?: TextMoves;
  /** Text blocks the user restyled one by one. */
  looks?: TextLooks;
  style: TextStyle;
  img: ImageSlot;
  usePhoto: boolean;
  background: string;
  /** How dark the photo is made behind the quote, 0–0.85; unset = 0.55. */
  darken?: number;
  /** Big quote mark above the text; unset = shown. */
  mark?: boolean;
  /** Text alignment; unset = centered. */
  align?: "center" | "left";
  quote: string;
  author: string;
  source: string;
  watermark: boolean;
}

/** A movie still with letterbox bars and subtitles, and an optional caption above. */
export interface ScenePost {
  /** Show @pagename in a corner. */
  watermark?: boolean;
  /** Text, photos and stickers added on top, per slide (see `Slide.own`). */
  extras?: Extras;
  /** Text blocks the user dragged or resized on the preview. */
  moves?: TextMoves;
  /** Text blocks the user restyled one by one. */
  looks?: TextLooks;
  /** The caption's style. */
  style: TextStyle;
  img: ImageSlot;
  /** Black bars above and below the still: none (full slide), 1.85:1 or 2.39:1. */
  bars: "none" | "thin" | "wide";
  subtitle: string;
  subColor: "yellow" | "white";
  italic: boolean;
  /** Text above the still, e.g. "POV: ..."; empty = hidden. */
  caption: string;
}

export interface ComparePost {
  /** Show @pagename in a corner. */
  watermark?: boolean;
  /** Text, photos and stickers added on top, per slide (see `Slide.own`). */
  extras?: Extras;
  /** Text blocks the user dragged or resized on the preview. */
  moves?: TextMoves;
  /** Text blocks the user restyled one by one. */
  looks?: TextLooks;
  style: TextStyle;
  layout: "side" | "stack";
  headline: string;
  left: ImageSlot;
  right: ImageSlot;
  leftLabel: string;
  rightLabel: string;
  vs: boolean;
}

/** A free-form text block on the blank canvas or on top of a template. Position is its center, as a fraction of the slide. */
export interface TextLayer {
  kind: "text";
  id: string;
  x: number;
  y: number;
  /** 0–1; unset = fully visible. */
  opacity?: number;
  /** Degrees, clockwise. */
  rotate?: number;
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
  effect: TextEffect;
  /** Outline, shadow, box or glow color. */
  effectColor: string;
  /** Outline thickness as a fraction of the font size; unset = 0.13. */
  stroke?: number;
}

/** A photo placed on the blank canvas or on top of a template. */
export interface ImageLayer {
  kind: "image";
  id: string;
  x: number;
  y: number;
  /** 0–1; unset = fully visible. */
  opacity?: number;
  /** Degrees, clockwise. */
  rotate?: number;
  img: ImageSlot;
  /** Width as a fraction of the slide width. */
  w: number;
  /** "free" keeps the photo's own shape; the others crop it. */
  crop: "free" | "square" | "wide" | "tall";
  shape: "rect" | "rounded" | "circle";
  border: boolean;
}

export type Layer = TextLayer | ImageLayer;
/** Layers added on top of a template, keyed by slide. */
export type Extras = Record<string, Layer[]>;

export interface CustomPost {
  /** Show @pagename in a corner. */
  watermark?: boolean;
  bg: "photo" | "color" | "gradient";
  bgImg: ImageSlot;
  bgColor: string;
  gradient: [string, string];
  /** Darkening over a photo background, 0–0.8. */
  darken: number;
  layers: Layer[];
}

export interface FollowPost {
  /** Text, photos and stickers added on top, per slide (see `Slide.own`). */
  extras?: Extras;
  /** Text blocks the user dragged or resized on the preview. */
  moves?: TextMoves;
  /** Text blocks the user restyled one by one. */
  looks?: TextLooks;
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
  scene: ScenePost;
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
  | "follow"
  | "scene";

export interface Slide {
  kind: SlideKind;
  label: string;
  /** Index into list items / news stories / lessons. */
  i?: number;
  /** Where this slide's own layers live: `posts[post].extras[key]` (the blank canvas keeps them in `layers`). */
  own: { post: keyof Posts; key: string };
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
  /** Degrees the layer or text block is turned, so its selection box turns with it. */
  rotate?: number;
  /** A template's text block: dragging and zooming change `moves[key]` (the object at `path`). */
  text?: TextBlock;
}

/**
 * What can be restyled on one template text block: "style" blocks use the template's text style
 * (font, colors), "color" blocks have one fixed color, "none" blocks (cards, badges) only move and resize.
 * `base` is how the template draws it before the user's own look.
 */
export interface TextBlock {
  key: string;
  look: "style" | "color" | "none";
  base: { color: string; font?: FontKey; accent?: string | null; caps?: boolean; effect?: TextEffect; effectColor?: string; stroke?: number };
  /** Center of the block where the template puts it, as fractions of the slide (for centering). */
  home: { cx: number; cy: number };
}

/** One text block's own look, over the template's. */
export type TextLook = Partial<Pick<TextStyle, "font" | "color" | "accent" | "caps" | "effect" | "effectColor" | "stroke">> & { opacity?: number };
export type TextLooks = Record<string, TextLook>;

/** How far a template's text block was dragged (fractions of the slide) and how much it was resized. */
export interface TextMove {
  dx: number;
  dy: number;
  s: number;
  /** Rotation in degrees. */
  r?: number;
}
export type TextMoves = Record<string, TextMove>;

export interface RenderState {
  brand: Brand;
  posts: Posts;
  frame: Frame;
}
