import { type Region, findStories } from "@/lib/newsFeed";

// Eleven feeds are read in parallel on a cold start.
export const maxDuration = 30;

/** Trending (or with `sort=new`, the newest) cinema stories, or stories matching `q`, from Hollywood and Indian film news sites. */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const q = (params.get("q") ?? "").slice(0, 100);
  const r = params.get("region");
  const region: Region | "all" = r === "hollywood" || r === "indian" ? r : "all";
  try {
    const stories = await findStories(q, region, params.get("sort") === "new" ? "new" : "top");
    return Response.json({ stories }, { headers: { "cache-control": "private, max-age=120" } });
  } catch (e) {
    console.error("feed", e);
    return Response.json({ error: "Couldn't load the news right now. Try again in a minute." }, { status: 500 });
  }
}
