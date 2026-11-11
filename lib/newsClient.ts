// Browser side of the news tools: ask the server to read the story, then fill the News story post with it.
import type { ImageSlot } from "@/types/post";
import { ownAiHeaders } from "@/lib/aiKey";
import { toastUndo } from "@/lib/history";
import { readImageFile } from "@/lib/images";
import { story, useEditor } from "@/lib/store";

/** How far news photos start zoomed out (1 = fill the slide, cropping a wide photo's sides). */
export const NEWS_ZOOM = 0.72;

interface Draft {
  headlines: string[];
  slides: string[];
  tag: string;
  sites: string[];
  photos: { url: string; from: string }[];
  ai: boolean;
}

/** A found photo as a data URL, through our own server so it can be drawn and downloaded; null if it can't be loaded. */
export async function loadFound(src: string) {
  try {
    const res = await fetch(`/api/news/image?url=${encodeURIComponent(src)}`);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await readImageFile(new File([blob], "news", { type: blob.type }));
  } catch {
    return null;
  }
}

/** The first `n` photos that load, in order (some sites refuse or send files that are too big). */
async function firstPhotos(photos: Draft["photos"], n: number) {
  const out: string[] = [];
  for (let i = 0; i < photos.length && out.length < n; i += 3) {
    const batch = await Promise.all(photos.slice(i, i + 3).map((p) => loadFound(p.url)));
    out.push(...batch.filter((b): b is string => !!b));
  }
  return out.slice(0, n);
}

/**
 * Fills the News story post from one article link or several links to the same story: the cover gets the first headline,
 * the outlets as its source line and the first photo; each story slide gets its own photo where there are enough.
 * `onPhotos` runs once the text is written and the photos start loading. Returns an error message, or null.
 */
export async function fillFromStory(urls: string[], onPhotos?: () => void): Promise<string | null> {
  let draft: Draft;
  try {
    const res = await fetch("/api/news", { method: "POST", headers: { "content-type": "application/json", ...ownAiHeaders() }, body: JSON.stringify({ urls }) });
    const data = (await res.json()) as Draft & { error?: string };
    if (!res.ok || data.error) return data.error ?? "Couldn't read that link.";
    draft = data;
  } catch {
    return "Couldn't reach the server. Check your connection.";
  }
  onPhotos?.();
  const loaded = await firstPhotos(draft.photos, draft.slides.length + 1);
  const st = useEditor.getState();
  const p = st.posts.news;
  // Cover first, then one per slide; with fewer photos than slides they repeat in turn.
  // Zoomed out and at the top: wide news photos show most of the picture, and the blurred fill sits under the headline.
  const photo = (i: number, base: ImageSlot): ImageSlot => (loaded.length ? { ...base, src: loaded[i % loaded.length], zoom: NEWS_ZOOM, ox: 0, oy: -1 } : base);
  const credit = draft.sites.join(", ");
  const stories = draft.slides.map((text, i) => {
    const s = story(`story ${i + 1}`, text);
    return { ...s, img: photo(i + 1, s.img) };
  });
  st.setFmt("news");
  st.update(["posts", "news"], {
    text: draft.headlines[0],
    headlines: draft.headlines,
    found: draft.photos.map(({ url, from }) => ({ url, from })),
    coverStyle: "even",
    tag: draft.tag,
    source: credit ? `Source: ${credit}` : "",
    swipe: true,
    insetOn: false,
    img: photo(0, p.img),
    stories,
  });
  st.select(0);
  const from = draft.sites[0] ?? "the article";
  // Short, so it fits the phone toast.
  const how = draft.ai ? `Filled from ${credit || from}.` : `Filled from ${from} with its own title.`;
  toastUndo(`${how}${loaded.length ? "" : " No photo could load; add one."} Check it before you post.`);
  return null;
}

export const fillFromLink = (url: string, onPhotos?: () => void) => fillFromStory([url], onPhotos);
