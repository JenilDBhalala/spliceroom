import type { FormatId, PostSize } from "@/types/post";

export interface TemplateInfo {
  id: FormatId;
  name: string;
  blurb: string;
  /** One line on how to fill it in, shown above its fields. */
  howto: string;
}

export interface TemplateGroup {
  name: string;
  templates: TemplateInfo[];
}

/** The template picker, grouped the way people look for them. */
export const TEMPLATE_GROUPS: TemplateGroup[] = [
  {
    name: "Memes & social",
    templates: [
      { id: "meme", name: "Meme", blurb: "Classic top and bottom text, or a caption bar above the photo.", howto: "Add your photo, then type the top and bottom text. Switch Meme style for a caption above the photo." },
      { id: "tweet", name: "Tweet / X post", blurb: "A post card on a plain background, screenshot style.", howto: "Type the post text and who posted it. The photo is optional; leave it empty for a text-only post." },
      { id: "quote", name: "Quote", blurb: "A big quote with who said it, on a photo or a color.", howto: "Type the quote and who said it, then pick a photo or a plain color behind it." },
      { id: "compare", name: "Comparison", blurb: "Two photos side by side: this vs that, before and after.", howto: "Add a photo and a label for each side." },
    ],
  },
  {
    name: "Movies",
    templates: [
      { id: "poster", name: "Movie poster", blurb: "Cast names, tagline, big title, release date and credits.", howto: "Add the poster photo, then the title, tagline and names. Leave any extra empty to hide it." },
      { id: "list", name: "Movie list", blurb: "A cover with photo strips, then one slide per movie with a rating.", howto: "Start with the cover, then tap the slides under the post to fill in each movie. + Add movie adds another." },
      { id: "lessons", name: "Lessons", blurb: "Lessons from a film: a cover, then one slide per lesson.", howto: "Start with the cover, then tap the slides under the post to write each lesson. + Add lesson adds another." },
      { id: "timeline", name: "Timeline", blurb: "A franchise or career, one photo row per year.", howto: "Give each row a year, a photo and a title." },
    ],
  },
  {
    name: "News",
    templates: [
      { id: "headline", name: "Headline", blurb: "One photo with a bold headline, plus an optional clean photo.", howto: "Add a photo and type the headline. Wrap words in *stars* to color them." },
      { id: "news", name: "News story", blurb: "A cover with a full-width headline, then story slides.", howto: "Write the cover headline, then tap the slides under the post to write each story slide." },
    ],
  },
  {
    name: "Your page",
    templates: [{ id: "follow", name: "Follow card", blurb: "Your profile card and a call to follow.", howto: "Write the headline. The card shows your profile (picture, name and numbers), which you fill in once under Profile." }],
  },
  {
    name: "Start from scratch",
    templates: [
      {
        id: "custom",
        name: "Blank canvas",
        blurb: "Any meme or poster: add text and photos anywhere. Start from a ready layout.",
        howto: "Tap any text or photo on the post to change it, and drag it to move it. Add more with + Text and + Photo.",
      },
    ],
  },
];

export const TEMPLATES = TEMPLATE_GROUPS.flatMap((g) => g.templates);
export const templateInfo = (id: FormatId) => TEMPLATES.find((t) => t.id === id)!;

export const SIZE_OPTIONS: { id: PostSize; label: string; hint: string }[] = [
  { id: "portrait", label: "4:5", hint: "Feed post · 1080 × 1350" },
  { id: "square", label: "1:1", hint: "Square post · 1080 × 1080" },
  { id: "story", label: "9:16", hint: "Story / reel · 1080 × 1920" },
];
