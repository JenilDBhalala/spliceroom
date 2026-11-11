// Server side of the news finder: read cinema news feeds, group the same story across outlets, and rank or search them.
import { safeFetch } from "./news";

export type Region = "hollywood" | "indian";

/** Feeds that answer today (Collider, Screen Rant, Empire, CBR and Koimoi didn't). */
/** `zone` replaces a feed's stated time zone when it's wrong. */
const FEEDS: { site: string; url: string; region: Region; zone?: string }[] = [
  { site: "Variety", url: "https://variety.com/v/film/feed/", region: "hollywood" },
  { site: "Deadline", url: "https://deadline.com/feed/", region: "hollywood" },
  { site: "The Hollywood Reporter", url: "https://www.hollywoodreporter.com/c/movies/feed/", region: "hollywood" },
  { site: "IndieWire", url: "https://www.indiewire.com/feed/", region: "hollywood" },
  { site: "/Film", url: "https://www.slashfilm.com/feed/", region: "hollywood" },
  { site: "TheWrap", url: "https://www.thewrap.com/feed/", region: "hollywood" },
  { site: "Rotten Tomatoes", url: "https://editorial.rottentomatoes.com/feed/", region: "hollywood" },
  { site: "ComingSoon", url: "https://www.comingsoon.net/feed", region: "hollywood" },
  // Writes Indian times but labels them +0200.
  { site: "Bollywood Hungama", url: "https://www.bollywoodhungama.com/rss/news.xml", region: "indian", zone: "+0530" },
  { site: "Pinkvilla", url: "https://www.pinkvilla.com/rss.xml", region: "indian" },
  { site: "NDTV Movies", url: "https://feeds.feedburner.com/ndtvmovies-latest", region: "indian" },
];

interface Item {
  title: string;
  link: string;
  site: string;
  region: Region;
  time: number;
  description: string;
  image: string | null;
  words: Set<string>;
}

export interface Story {
  id: string;
  title: string;
  sources: { site: string; url: string }[];
  time: number;
  image: string | null;
  region: Region;
}

const decode = (s: string) =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (m, e: string) =>
      e[0] === "#" ? String.fromCodePoint(e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : +e.slice(1)) : ({ amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " } as Record<string, string>)[e.toLowerCase()] ?? m,
    )
    .replace(/\s+/g, " ")
    .trim();

// Words that say nothing about which story it is.
const STOP = new Set(
  "the a an and or of to in on for at by with from as is are was were be been it its this that these those his her their he she they you your our new first after over into about how why what who when will just more most than out up off says said gets get set sets reveals revealed report reports exclusive watch trailer review film movie movies series season show box office star stars actor actress director release date official update news latest".split(" "),
);

const wordsOf = (s: string) =>
  new Set(
    s
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[’']s\b/g, "")
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 2 && !STOP.has(w)),
  );

/** A feed date in ms; never in the future, so a wrong time zone can't put a story above newer ones. */
function dateOf(raw: string, zone?: string) {
  const t = Date.parse(zone ? raw.replace(/\s*(?:[+-]\d{4}|GMT|UTC|Z)\s*$/i, ` ${zone}`) : raw) || 0;
  return Math.min(t, Date.now());
}

function parse(xml: string, site: string, region: Region, zone?: string): Item[] {
  return [...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)].slice(0, 40).flatMap(([item]) => {
    const tag = (n: string) => new RegExp(`<${n}\\b[^>]*>([\\s\\S]*?)</${n}>`, "i").exec(item)?.[1] ?? "";
    const title = decode(tag("title"));
    const link = decode(tag("link")) || /<guid[^>]*isPermaLink="true"[^>]*>([^<]+)/i.exec(item)?.[1] || "";
    if (!title || !/^https?:\/\//.test(link)) return [];
    const image =
      /<media:(?:content|thumbnail)[^>]+url=["']([^"']+)["']/i.exec(item)?.[1] ??
      /<enclosure[^>]+url=["']([^"']+\.(?:jpe?g|png|webp)[^"']*)["']/i.exec(item)?.[1] ??
      /<img[^>]+src=["']([^"']+)["']/i.exec(tag("content:encoded") || tag("description"))?.[1] ??
      null;
    const time = dateOf(decode(tag("pubDate")) || decode(tag("dc:date")), zone);
    const description = decode(tag("description")).slice(0, 400);
    return [{ title, link, site, region, time, description, image: image ? decode(image) : null, words: wordsOf(title) }];
  });
}

const FRESH = 10 * 60 * 1000;
// Best effort: each server instance keeps its own copy for ten minutes.
let cache: { at: number; items: Item[] } | null = null;

async function allItems(): Promise<Item[]> {
  if (cache && Date.now() - cache.at < FRESH) return cache.items;
  const got = await Promise.allSettled(
    FEEDS.map(async (f) => parse((await safeFetch(f.url, { maxBytes: 3_000_000, accept: /xml|rss|atom|text/i })).bytes.toString("utf8"), f.site, f.region, f.zone)),
  );
  const items = got.flatMap((g) => (g.status === "fulfilled" ? g.value : []));
  if (items.length) cache = { at: Date.now(), items };
  return items;
}

/** Same story: at least two telling title words in common, a third of the shorter title's, within three days. */
function same(a: Item, b: Item) {
  if (Math.abs(a.time - b.time) > 72 * 3600e3) return false;
  let shared = 0;
  a.words.forEach((w) => b.words.has(w) && shared++);
  return shared >= 2 && shared / Math.max(1, Math.min(a.words.size, b.words.size)) >= 0.34;
}

/** Groups items by comparing each with a story's first item only, so one loose match can't chain unrelated news together. */
function group(items: Item[]): { items: Item[] }[] {
  const stories: { items: Item[] }[] = [];
  for (const it of [...items].sort((a, b) => b.time - a.time)) {
    const home = stories.find((s) => same(s.items[0], it));
    if (home) home.items.push(it);
    else stories.push({ items: [it] });
  }
  return stories;
}

const toStory = ({ items }: { items: Item[] }): Story => {
  // One link per outlet, newest first.
  const bySite = new Map<string, Item>();
  items.forEach((it) => !bySite.has(it.site) && bySite.set(it.site, it));
  const first = items[0];
  return {
    id: first.link,
    title: first.title,
    sources: [...bySite.values()].map((it) => ({ site: it.site, url: it.link })),
    time: first.time,
    image: items.find((it) => it.image)?.image ?? null,
    region: first.region,
  };
};

/**
 * Stories matching `q` (every word should appear in a title or summary), or with no `q`, what's trending:
 * the stories most outlets are covering, newest first, from the last two days. `sort` "new" puts the newest first instead.
 */
export async function findStories(q: string, region: Region | "all", sort: "top" | "new" = "top"): Promise<Story[]> {
  const items = (await allItems()).filter((it) => region === "all" || it.region === region);
  const stories = group(items);
  const now = Date.now();
  if (q.trim()) {
    const want = q
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 1);
    const score = (s: { items: Item[] }) => {
      const hay = s.items.map((it) => `${it.title} ${it.description}`.toLowerCase()).join(" ");
      return want.filter((w) => hay.includes(w)).length;
    };
    return stories
      .map((s) => ({ s, n: score(s) }))
      .filter(({ n }) => n >= Math.max(1, Math.ceil(want.length * 0.6)))
      .sort((a, b) => (sort === "new" ? 0 : b.n - a.n) || b.s.items[0].time - a.s.items[0].time)
      .slice(0, 20)
      .map(({ s }) => toStory(s));
  }
  const day = 24 * 3600e3;
  const heat = (s: { items: Item[] }) => new Set(s.items.map((it) => it.site)).size * 3 + Math.max(0, 1 - (now - s.items[0].time) / (2 * day)) * 2;
  return stories
    .filter((s) => now - s.items[0].time < 2 * day)
    .sort((a, b) => (sort === "new" ? b.items[0].time - a.items[0].time : heat(b) - heat(a)))
    .slice(0, 20)
    .map(toStory);
}
