import {
  type Photo,
  NewsError,
  askGemini,
  commonsPhotos,
  fallbackDraft,
  ownAi,
  readArticle,
  safeFetch,
  takeAiFill,
  tmdbPhotos,
  uniquePhotos,
} from "@/lib/news";

// Several articles, Gemini and the photo searches can take a while.
export const maxDuration = 60;

/**
 * Reads one news article (`url`) or the same story from several outlets (`urls`, up to 3) and returns
 * 3 headline options, 2–3 story slides, a tag, the sources and the photos found for it.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { url?: unknown; urls?: unknown } | null;
  const urls = (Array.isArray(body?.urls) ? body.urls : [body?.url]).filter((u): u is string => typeof u === "string" && !!u.trim()).slice(0, 3);
  if (!urls.length) return Response.json({ error: "Paste a news link first." }, { status: 400 });
  try {
    const read = await Promise.allSettled(
      urls.map(async (u) => {
        const page = await safeFetch(u.trim(), { maxBytes: 2_000_000, accept: /text\/html|application\/xhtml/i });
        return readArticle(page.bytes.toString("utf8"), page.url);
      }),
    );
    const articles = read.flatMap((r) => (r.status === "fulfilled" && (r.value.title || r.value.text) ? [r.value] : []));
    if (!articles.length) {
      const first = read.find((r) => r.status === "rejected")?.reason;
      if (first instanceof NewsError) throw first;
      return Response.json({ error: "Couldn't find an article on that page." }, { status: 422 });
    }
    const visitor = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
    // A visitor's own Gemini key has no daily limit here; ours does.
    const own = ownAi(request);
    const ai = own ? await askGemini(articles, own) : process.env.GEMINI_API_KEY && takeAiFill(visitor) ? await askGemini(articles) : null;
    const draft = ai ?? fallbackDraft(articles[0]);
    // TMDB and Wikimedia photos need licenses and per-photo credits we can't give on the live site, so they're for local use only.
    const extra = process.env.NODE_ENV !== "production";
    const [tmdb, commons] = extra ? await Promise.all([tmdbPhotos(draft.films, draft.people, draft.names), commonsPhotos(draft.people.slice(0, 2))]) : [[], []];
    // Slides take photos in this order: each outlet's main photo alternating with TMDB's HD ones, then the rest.
    const mains = articles.flatMap((a) => a.photos.slice(0, 1));
    const rest = articles.flatMap((a) => a.photos.slice(1));
    const mixed = Array.from({ length: Math.max(mains.length, 2) }, (_, i) => [mains[i], tmdb[i]]).flat().filter((x): x is Photo => !!x);
    const photos: Photo[] = uniquePhotos([...mixed, ...rest, ...tmdb.slice(2), ...commons]).slice(0, 16);
    return Response.json({
      headlines: draft.headlines,
      slides: draft.slides,
      tag: draft.tag,
      sites: [...new Set(articles.map((a) => a.site))],
      photos,
      ai: !!ai,
    });
  } catch (e) {
    if (e instanceof NewsError) return Response.json({ error: e.message }, { status: 422 });
    console.error("news", e);
    return Response.json({ error: "Something went wrong reading that page." }, { status: 500 });
  }
}
