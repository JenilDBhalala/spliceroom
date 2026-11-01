import type { FormatId, PostSize } from "@/types/post";

export interface TemplateInfo {
  id: FormatId;
  name: string;
  blurb: string;
}

export interface TemplateGroup {
  name: string;
  templates: TemplateInfo[];
}

/** The template picker, grouped the way people look for them. */
export const TEMPLATE_GROUPS: TemplateGroup[] = [
  {
    name: "Make your own",
    templates: [
      {
        id: "custom",
        name: "Blank canvas",
        blurb: "Any meme or poster: add text and photos anywhere. Start from a ready layout.",
      },
    ],
  },
  {
    name: "Memes & social",
    templates: [
      { id: "meme", name: "Meme", blurb: "Classic top and bottom text, or a caption bar above the photo." },
      { id: "tweet", name: "Tweet / X post", blurb: "A post card on a plain background, screenshot style." },
      { id: "quote", name: "Quote", blurb: "A big quote with who said it, on a photo or a color." },
      { id: "compare", name: "Comparison", blurb: "Two photos side by side: this vs that, before and after." },
    ],
  },
  {
    name: "Movies",
    templates: [
      { id: "poster", name: "Movie poster", blurb: "Cast names, tagline, big title, release date and credits." },
      { id: "list", name: "Movie list", blurb: "A cover with photo strips, then one slide per movie with a rating." },
      { id: "lessons", name: "Lessons", blurb: "Lessons from a film: a cover, then one slide per lesson." },
      { id: "timeline", name: "Timeline", blurb: "A franchise or career, one photo row per year." },
    ],
  },
  {
    name: "News",
    templates: [
      { id: "headline", name: "Headline", blurb: "One photo with a bold headline, plus an optional clean photo." },
      { id: "news", name: "News story", blurb: "A cover with a full-width headline, then story slides." },
    ],
  },
  {
    name: "Your page",
    templates: [{ id: "follow", name: "Follow card", blurb: "Your profile card and a call to follow." }],
  },
];

export const TEMPLATES = TEMPLATE_GROUPS.flatMap((g) => g.templates);
export const templateInfo = (id: FormatId) => TEMPLATES.find((t) => t.id === id)!;

export const SIZE_OPTIONS: { id: PostSize; label: string; hint: string }[] = [
  { id: "portrait", label: "4:5", hint: "Feed post · 1080 × 1350" },
  { id: "square", label: "1:1", hint: "Square post · 1080 × 1080" },
  { id: "story", label: "9:16", hint: "Story / reel · 1080 × 1920" },
];
