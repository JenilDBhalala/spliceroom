// Server side of "Make from a news link": fetch a page safely, read the article, and ask Gemini for a headline and slides.
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { SITE_NAME, SITE_URL } from "./site";

// Wikimedia asks for a descriptive agent with a way to reach the operator.
const UA = `Mozilla/5.0 (compatible; ${SITE_NAME}Bot/1.0; +${SITE_URL.origin})`;
const TIMEOUT = 8000;
const MAX_REDIRECTS = 3;

export class NewsError extends Error {}

/** Private, loopback, link-local and other non-public addresses: never fetched, so a link can't reach inside the server's network. */
function isPrivate(ip: string) {
  if (isIP(ip) === 6) {
    const v = ip.toLowerCase();
    const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(v);
    if (mapped) return isPrivate(mapped[1]);
    return v === "::" || v === "::1" || /^f[cd]/.test(v) || /^fe[89ab]/.test(v) || v.startsWith("ff");
  }
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19))
  );
}

async function checkUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new NewsError("That doesn't look like a link. Paste the full address, starting with https://");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new NewsError("Only web links (https://…) work here.");
  if (url.username || url.password) throw new NewsError("Links with a username or password don't work here.");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  const addrs = isIP(host) ? [{ address: host }] : await lookup(host, { all: true }).catch(() => []);
  if (!addrs.length) throw new NewsError("Couldn't find that website. Check the link.");
  if (addrs.some((a) => isPrivate(a.address))) throw new NewsError("That link isn't a public website.");
  return url;
}

/**
 * Fetches a public URL: every redirect is checked again, the whole request times out,
 * and at most `maxBytes` are read. `accept` filters the content type (e.g. /^image\//).
 */
export async function safeFetch(raw: string, { maxBytes, accept }: { maxBytes: number; accept: RegExp }) {
  let url = await checkUrl(raw);
  const signal = AbortSignal.timeout(TIMEOUT);
  for (let hop = 0; ; hop++) {
    const res = await fetch(url, {
      redirect: "manual",
      signal,
      headers: { "user-agent": UA, accept: "text/html,application/xhtml+xml,image/*;q=0.9,*/*;q=0.5" },
    }).catch((e: Error) => {
      throw new NewsError(e.name === "TimeoutError" ? "That website took too long to answer." : "Couldn't open that link.");
    });
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      if (hop >= MAX_REDIRECTS) throw new NewsError("That link redirects too many times.");
      url = await checkUrl(new URL(res.headers.get("location")!, url).href);
      continue;
    }
    if (!res.ok)
      throw new NewsError(
        res.status === 403 || res.status === 401 ? "That website doesn't let us read the page." : `That page answered with an error (${res.status}).`,
      );
    const type = res.headers.get("content-type") ?? "";
    if (!accept.test(type)) throw new NewsError("That link isn't the kind of page we can use.");
    if (+(res.headers.get("content-length") ?? 0) > maxBytes) throw new NewsError("That file is too big.");
    const reader = res.body!.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > maxBytes) {
        await reader.cancel();
        // HTML past the limit is cut off (the article start is what matters); images can't be.
        if (accept.test("text/html")) break;
        throw new NewsError("That file is too big.");
      }
      chunks.push(value);
    }
    return { bytes: Buffer.concat(chunks), type, url };
  }
}

/* ---------- reading the article ---------- */

/** A photo found for the story, and where it came from. */
export interface Photo {
  url: string;
  /** Width when known, for ranking. */
  w?: number;
  from: string;
}

export interface Article {
  url: string;
  title: string;
  site: string;
  image: string | null;
  description: string;
  text: string;
  /** The article's main image first, then large images from its body. */
  photos: Photo[];
}

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
  mdash: "—",
  ndash: "–",
  hellip: "…",
};
const decode = (s: string) =>
  s.replace(/&(#x[\da-f]+|#\d+|\w+);/gi, (m, e: string) =>
    e[0] === "#" ? String.fromCodePoint(e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : +e.slice(1)) : (ENTITIES[e.toLowerCase()] ?? m),
  );
// Line breaks become spaces; inline tags (links, italics) vanish without adding any.
const clean = (s: string) =>
  decode(s.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, ""))
    .replace(/\s+/g, " ")
    .trim();

function meta(html: string, names: string[]) {
  for (const n of names) {
    const tag = new RegExp(`<meta[^>]+(?:property|name)=["']${n}["'][^>]*>`, "i").exec(html)?.[0];
    const content = tag && /content=["']([^"']*)["']/i.exec(tag)?.[1];
    if (content?.trim()) return decode(content.trim());
  }
  return "";
}

/** The article body from JSON-LD when the page has one (most news sites do). */
function jsonLdBody(html: string) {
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const found: string[] = [];
      const walk = (v: unknown) => {
        if (Array.isArray(v)) v.forEach(walk);
        else if (v && typeof v === "object") {
          const o = v as Record<string, unknown>;
          if (typeof o.articleBody === "string") found.push(o.articleBody);
          Object.values(o).forEach(walk);
        }
      };
      walk(JSON.parse(m[1]));
      if (found[0]) return clean(found[0]);
    } catch {}
  }
  return "";
}

/**
 * A larger copy of a news photo where the site resizes by query (WordPress: ?w=1000&h=563&crop=1 → ?w=1600),
 * so it stays sharp on a 1080-wide post.
 */
export function bigger(raw: string) {
  try {
    const u = new URL(raw);
    if (u.searchParams.has("w") || u.pathname.includes("/wp-content/uploads/")) {
      u.searchParams.delete("h");
      u.searchParams.delete("crop");
      u.searchParams.delete("resize");
      u.searchParams.set("w", "1600");
    }
    return u.href;
  } catch {
    return raw;
  }
}

// Logos, avatars, icons, tracking pixels and ads aren't story photos.
const NOT_PHOTO = /logo|icon|avatar|sprite|placeholder|blank|pixel|spacer|badge|author|gravatar|emoji|\.svg|\.gif|doubleclick|adsystem/i;

/**
 * Large images inside the article body: the biggest srcset candidate, or a lazy-load / plain src.
 * Only images whose file name or alt text mentions the story (`about`) count, so related-story thumbnails are left out.
 */
function bodyPhotos(area: string, pageUrl: URL, from: string, about: Set<string>): Photo[] {
  const out: Photo[] = [];
  for (const m of area.matchAll(/<img\b[^>]*>/gi)) {
    const tag = m[0];
    const attr = (n: string) => new RegExp(`\\s${n}=["']([^"']+)["']`, "i").exec(tag)?.[1];
    let url = attr("src");
    let w = Number(attr("width")) || undefined;
    const set = attr("srcset") ?? attr("data-srcset") ?? attr("data-lazy-srcset");
    if (set) {
      const best = set
        .split(",")
        .map((c) => c.trim().split(/\s+/))
        .map(([u, d]) => ({ u, w: d?.endsWith("w") ? parseInt(d) : 0 }))
        .sort((x, y) => y.w - x.w)[0];
      if (best?.u) [url, w] = [best.u, best.w || w];
    }
    url = attr("data-lazy-src") ?? attr("data-src") ?? url;
    if (!url || url.startsWith("data:") || NOT_PHOTO.test(url)) continue;
    if (!/\.(jpe?g|png|webp|avif)(\?|$)/i.test(url) && !/[?&](w|width)=/.test(url)) continue;
    const said = words(`${decodeURIComponent(url.split("/").pop() ?? "")} ${attr("alt") ?? ""}`);
    if (![...said].some((w) => about.has(w))) continue;
    if (w !== undefined && w < 600) continue;
    try {
      out.push({ url: bigger(new URL(decode(url), pageUrl).href), w, from });
    } catch {}
  }
  return out;
}

/** Telling lowercase words of a title or file name, for matching photos to the story. */
const words = (s: string) =>
  new Set(
    s
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 3 && !/^(\d+|jpe?g|png|webp|image|photo|getty|images|with|from|that|this|their|after)$/.test(w)),
  );

export function readArticle(html: string, pageUrl: URL): Article {
  // "ComingSoon.net - Movie Trailers, TV & Streaming News, and More" → "ComingSoon.net".
  const site = (meta(html, ["og:site_name", "application-name"]) || pageUrl.hostname.replace(/^www\./, "")).split(/\s+[-|–—:]\s+/)[0];
  // "Headline | Variety" → "Headline".
  const rawTitle = meta(html, ["og:title", "twitter:title"]) || clean(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? "");
  const title = rawTitle.replace(new RegExp(`\\s*[|–—-]\\s*${site.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "i"), "").trim();
  const img = meta(html, ["og:image:secure_url", "og:image", "twitter:image", "twitter:image:src"]);
  let image: string | null = null;
  try {
    image = img ? bigger(new URL(img, pageUrl).href) : null;
  } catch {}
  // Paragraphs of the <article> with the most text (pages list related stories as articles too), else the whole page.
  const page = html.replace(/<(script|style|noscript|svg|template)\b[\s\S]*?<\/\1>/gi, " ");
  const parasOf = (s: string) => [...s.matchAll(/<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/gi)].map((m) => clean(m[1])).filter((p) => p.length > 60);
  const size = (ps: string[]) => ps.reduce((n, p) => n + p.length, 0);
  const articles = [...page.matchAll(/<article\b[\s\S]*?<\/article>/gi)].map((m) => ({ html: m[0], paras: parasOf(m[0]) }));
  const main = articles.sort((a, b) => size(b.paras) - size(a.paras))[0];
  const paras = main && size(main.paras) >= 400 ? main.paras : parasOf(page);
  // Some sites put only an excerpt in JSON-LD, so the longer of the two wins.
  const ld = jsonLdBody(html);
  const body = paras.join("\n\n");
  const text = (ld.length > body.length ? ld : body).slice(0, 12000);
  const photos = [...(image ? [{ url: image, from: site }] : []), ...bodyPhotos(main?.html ?? "", pageUrl, site, words(title))];
  return {
    url: pageUrl.href,
    title,
    site,
    image,
    description: meta(html, ["og:description", "description", "twitter:description"]),
    text,
    photos: uniquePhotos(photos).slice(0, 6),
  };
}

/** Drops repeats of the same picture (same path, different size). */
export function uniquePhotos(photos: Photo[]) {
  const seen = new Set<string>();
  return photos.filter((p) => {
    let key = p.url;
    try {
      const u = new URL(p.url);
      // The path alone: sites serve one file from several image hosts (media5.…, stat5.…).
      key = u.pathname.replace(/-\d+x\d+(?=\.\w+$)/, "");
    } catch {}
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/* ---------- headlines and slides ---------- */

export interface NewsPostDraft {
  /** Three headline options; the first is used. */
  headlines: string[];
  slides: string[];
  /** A label like TRAILER or EXCLUSIVE, only when the story clearly is one. */
  tag: string;
  /** Films and people in the story, for finding more photos. */
  films: string[];
  people: string[];
  /** Names that may be either (found without AI, in the title and summary). */
  names?: string[];
}

// Two or more capitalized words in a row: a name or a title.
const NAME = /(?:^|[\s‘“'"(])((?:[A-Z][\w’'.-]+)(?:\s+(?:of|the|and|&|[A-Z][\w’'.-]+))*\s+[A-Z][\w’'.-]+)/;

/** Stars the first name in a headline, so it shows in the theme color. */
const starName = (s: string) => {
  const m = NAME.exec(s);
  return m ? s.replace(m[1], `*${m[1]}*`) : s;
};

/** Without AI: the article's own title, and its first sentences grouped into 2–3 slides. */
export function fallbackDraft(a: Article): NewsPostDraft {
  const sentences = (a.text || a.description)
    .split(/(?<=[.!?…][”"’)]?)\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const slides: string[] = [];
  let cur = "";
  for (const sn of sentences) {
    const one = sn.length > 220 ? `${sn.slice(0, 217).replace(/\s+\S*$/, "")}…` : sn;
    if (cur && (cur + " " + one).length > 220) {
      slides.push(cur);
      cur = one;
    } else cur = cur ? `${cur} ${one}` : one;
    if (slides.length >= 3) break;
  }
  if (cur && slides.length < 3) slides.push(cur);
  const title = a.title || a.description;
  return {
    headlines: [starName(title), ...(a.description && a.description !== title ? [starName(a.description.split(/(?<=[.!?])\s/)[0])] : [])],
    slides: slides.length ? slides : [a.description].filter(Boolean),
    tag: "",
    films: [],
    people: [],
    names: namesIn(`${title}. ${a.description}`),
  };
}

// News words that trail a film's name in headlines ("Ramayana Part One Box Office Collections").
const TRAILING =
  /\s+(?:box office|collections?|day \d+|trailer|teaser|review|reactions?|first look|release date|cast|update|song|poster|starrer|worldwide)\b.*$/i;

/** Quoted titles and capitalized names, for looking up photos when there's no AI. */
function namesIn(text: string) {
  const quoted = [...text.matchAll(/[‘“"']([^‘’“”"']{3,40})[’”"']/g)].map((m) => m[1]);
  const caps = [...text.matchAll(new RegExp(NAME, "g"))].map((m) => m[1]);
  const out = [...quoted, ...caps].map((n) => n.replace(TRAILING, "").trim()).filter((n) => n.length > 2);
  return [...new Set(out)].slice(0, 4);
}

const PROMPT = `You write Instagram carousel posts for a cinema news page.
From the article(s) below (several sources may cover the same story), write:
- "headlines": 3 different cover headlines, each 7 to 12 words, plain and punchy like big cinema news pages ("JAMES GUNN RELEASED A STATEMENT AFTER STEPPING DOWN AS CEO OF DC STUDIOS"): one straight news, one leading with the person, one leading with the film or the surprise. Start with the news, not with "Following" or "After". No full stop at the end, no emojis, no hashtags, no clickbait questions, no quotes around them.
- "slides": 2 or 3 short slides that tell the story in order, each 1 to 3 sentences and under 230 characters.
- In every headline and slide, wrap the 1 to 3 most important words (a name, a film title, a number) in *asterisks*, e.g. *James Gunn* steps down as CEO of *DC Studios*.
- "tag": one or two words such as TRAILER, EXCLUSIVE, BOX OFFICE, CASTING, FIRST LOOK or RELEASE DATE, only if the story clearly is that; otherwise "".
- "films": the film or show titles in the story. "people": the main people's full names.
Use only facts stated in the articles. Do not guess dates, numbers or names that are not in them.`;

/** A visitor's own Gemini key and model, sent with their request and never stored. */
export interface OwnAi {
  key: string;
  model: string;
}

/** Why Gemini refused a visitor's own key, in words they can act on. */
function ownKeyError(status: number) {
  if (status === 429) return "Your Gemini key has reached its limit for now. Try again later, or remove it in AI settings to use ours.";
  if (status === 404) return "Your Gemini key can't use that model. Pick another in AI settings.";
  return "Your Gemini key didn't work. Check it in AI settings.";
}

/**
 * Asks Gemini for JSON matching `schema`, with the visitor's own key or ours. Null when there's no key or the call fails;
 * with the visitor's own key, a refusal throws a NewsError they can act on instead.
 */
async function geminiJson<T>(prompt: string, schema: object, own: OwnAi | undefined, temperature: number): Promise<Partial<T> | null> {
  const key = own?.key ?? process.env.GEMINI_API_KEY;
  if (!key) return null;
  const model = own?.model || process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      signal: AbortSignal.timeout(25000),
      headers: { "content-type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature, responseMimeType: "application/json", responseSchema: schema },
      }),
    });
    if (!res.ok) {
      // A visitor's own key: tell them; it isn't logged.
      if (own) throw new NewsError(ownKeyError(res.status));
      console.error("Gemini", res.status, (await res.text()).slice(0, 300));
      return null;
    }
    const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    return JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text ?? "") as Partial<T>;
  } catch (e) {
    if (e instanceof NewsError) throw e;
    console.error("Gemini", e);
    return null;
  }
}

const STRINGS = { type: "ARRAY", items: { type: "STRING" } };

/** Up to `n` non-empty trimmed strings from an AI list. */
const list = (v: unknown, n: number) =>
  Array.isArray(v)
    ? v
        .map((s) => String(s).trim())
        .filter(Boolean)
        .slice(0, n)
    : [];

/** Gemini's headlines and slides from one or more articles, or null when there's no key or the call fails (the caller falls back). */
export async function askGemini(articles: Article[], own?: OwnAi): Promise<NewsPostDraft | null> {
  const usable = articles.filter((a) => a.text);
  if (!usable.length) return null;
  const share = Math.floor(12000 / usable.length);
  const text = usable.map((a) => `Source: ${a.site}\nTitle: ${a.title}\n\n${a.text.slice(0, share)}`).join("\n\n---\n\n");
  const out = await geminiJson<NewsPostDraft>(
    `${PROMPT}\n\n${text}`,
    {
      type: "OBJECT",
      properties: { headlines: STRINGS, slides: STRINGS, tag: { type: "STRING" }, films: STRINGS, people: STRINGS },
      required: ["headlines", "slides", "tag", "films", "people"],
    },
    own,
    0.5,
  );
  if (!out) return null;
  const headlines = list(out.headlines, 3).map((h) => h.replace(/\.$/, ""));
  const slides = list(out.slides, 3);
  if (!headlines.length || !slides.length) return null;
  return {
    headlines,
    slides,
    tag: String(out.tag ?? "")
      .trim()
      .toUpperCase()
      .slice(0, 24),
    films: list(out.films, 3),
    people: list(out.people, 3),
  };
}

/** Reads a visitor's own key and model from the request headers; null when they didn't set one. */
export function ownAi(request: Request): OwnAi | null {
  const key = request.headers.get("x-gemini-key")?.trim() ?? "";
  // Older keys look like AIza…, newer ones like AQ.…
  if (!/^[\w.-]{20,200}$/.test(key)) return null;
  const model = request.headers.get("x-gemini-model")?.trim() ?? "";
  return { key, model: /^[\w.-]{1,80}$/.test(model) ? model : "" };
}

/** Numbered stable models first, newest first; previews and "-latest" aliases after them. */
function rank(id: string) {
  const v = Number(/^gemini-(\d+(?:\.\d+)?)-/.exec(id)?.[1] ?? 0);
  return /preview|exp/.test(id) ? v - 100 : v || -50;
}

/** The Gemini models a key can write text with, newest stable versions first; throws NewsError if the key doesn't work. */
export async function geminiModels(key: string): Promise<{ id: string; name: string }[]> {
  const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=200", {
    signal: AbortSignal.timeout(10000),
    headers: { "x-goog-api-key": key },
  });
  if (!res.ok) throw new NewsError(ownKeyError(res.status));
  const data = (await res.json()) as { models?: { name: string; displayName?: string; supportedGenerationMethods?: string[] }[] };
  return (data.models ?? [])
    .filter((m) => m.supportedGenerationMethods?.includes("generateContent") && /^models\/gemini-/.test(m.name))
    // Image, speech, transcription and tool-only models can't write the post.
    .filter((m) => !/tts|image|embed|live|audio|robotics|computer|vision|transcribe|banana|omni|customtools/i.test(m.name))
    .map((m) => ({ id: m.name.replace(/^models\//, ""), name: m.displayName || m.name }))
    .sort((a, b) => rank(b.id) - rank(a.id) || b.id.localeCompare(a.id, undefined, { numeric: true }));
}

/* ---------- more photos: TMDB and Wikimedia Commons ---------- */

/** HD stills and backdrops for films, and photos of people, from TMDB (only with TMDB_API_KEY). */
export async function tmdbPhotos(films: string[], people: string[], names: string[] = []): Promise<Photo[]> {
  const key = process.env.TMDB_API_KEY;
  if (!key) return [];
  // A v4 read access token is long; a v3 API key is 32 characters.
  const auth = key.length > 40 ? { headers: { authorization: `Bearer ${key}` } } : {};
  const q = key.length > 40 ? "" : `&api_key=${key}`;
  const get = async <T>(path: string): Promise<T | null> => {
    try {
      const res = await fetch(`https://api.themoviedb.org/3${path}${path.includes("?") ? "&" : "?"}${q.slice(1)}`, {
        ...auth,
        signal: AbortSignal.timeout(6000),
      });
      return res.ok ? ((await res.json()) as T) : null;
    } catch {
      return null;
    }
  };
  type Hit = { id: number; media_type: string; title?: string; name?: string; popularity?: number };
  type Images = { backdrops?: { file_path: string; width: number }[]; profiles?: { file_path: string; width: number }[] };
  const one = async (name: string, kind: "film" | "person" | "any"): Promise<Photo[]> => {
    const hits = await get<{ results: Hit[] }>(`/search/multi?query=${encodeURIComponent(name)}&include_adult=false`);
    // The news is about the current one: of the right kind, an exact title match first, then the most popular.
    const exact = (h: Hit) => ((h.title ?? h.name ?? "").toLowerCase() === name.toLowerCase() ? 1 : 0);
    const hit = (hits?.results ?? [])
      .filter(
        (h) =>
          ((kind === "any" || kind === "person") && h.media_type === "person") ||
          (kind !== "person" && (h.media_type === "movie" || h.media_type === "tv")),
      )
      .sort((a, b) => exact(b) - exact(a) || (b.popularity ?? 0) - (a.popularity ?? 0))[0];
    if (!hit) return [];
    const imgs = await get<Images>(`/${hit.media_type}/${hit.id}/images?include_image_language=en,null`);
    if (hit.media_type === "person")
      return (imgs?.profiles ?? []).slice(0, 2).map((p) => ({ url: `https://image.tmdb.org/t/p/original${p.file_path}`, w: p.width, from: "TMDB" }));
    return (imgs?.backdrops ?? []).slice(0, 4).map((b) => ({ url: `https://image.tmdb.org/t/p/w1280${b.file_path}`, w: 1280, from: "TMDB" }));
  };
  const all = await Promise.all([...films.map((f) => one(f, "film")), ...people.map((p) => one(p, "person")), ...names.map((n) => one(n, "any"))]);
  return all.flat();
}

/** Free photos of the people in the story from Wikimedia Commons (no key needed). */
export async function commonsPhotos(people: string[]): Promise<Photo[]> {
  const one = async (name: string): Promise<Photo[]> => {
    const parts = name.toLowerCase().split(/\s+/);
    // One-word names (Yash, Zendaya) match too many people's files.
    if (parts.length < 2) return [];
    const api = new URL("https://commons.wikimedia.org/w/api.php");
    Object.entries({
      action: "query",
      format: "json",
      generator: "search",
      gsrsearch: `"${name}" filetype:bitmap`,
      gsrnamespace: "6",
      gsrlimit: "4",
      prop: "imageinfo",
      iiprop: "url|size|mime",
      iiurlwidth: "1600",
    }).forEach(([k, v]) => api.searchParams.set(k, v));
    try {
      const res = await fetch(api, { headers: { "user-agent": UA }, signal: AbortSignal.timeout(6000) });
      if (!res.ok) return [];
      type Info = { thumburl?: string; width: number; mime: string };
      const data = (await res.json()) as { query?: { pages?: Record<string, { imageinfo?: Info[] }> } };
      return Object.values(data.query?.pages ?? {})
        .map((pg) => pg.imageinfo?.[0])
        // The file must name the person in full ("Yash" alone also finds Yash Chopra).
        .filter((i): i is Info => !!i?.thumburl && /jpeg|png/.test(i.mime) && i.width >= 900 && parts.every((w) => decodeURIComponent(i.thumburl!).toLowerCase().includes(w)))
        .slice(0, 2)
        .map((i) => ({ url: i.thumburl!, w: Math.min(1600, i.width), from: "Wikimedia Commons" }));
    } catch {
      return [];
    }
  };
  return (await Promise.all(people.map(one))).flat();
}

/* ---------- a small per-visitor limit on AI fills ---------- */

const DAY = 24 * 60 * 60 * 1000;
const PER_DAY = 20;
// Best effort: each server instance keeps its own counts.
const uses = new Map<string, { n: number; since: number }>();

/** True if this visitor may use another AI fill today (and counts it). */
export function takeAiFill(visitor: string) {
  // On your own computer every request is the same visitor, so the limit only applies on the live site.
  if (process.env.NODE_ENV !== "production") return true;
  const now = Date.now();
  const u = uses.get(visitor);
  if (!u || now - u.since > DAY) {
    if (uses.size > 5000) uses.clear();
    uses.set(visitor, { n: 1, since: now });
    return true;
  }
  if (u.n >= PER_DAY) return false;
  u.n++;
  return true;
}
