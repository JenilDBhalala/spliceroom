import { NewsError, safeFetch } from "@/lib/news";

/** The article's image, served from this site so it can be drawn and downloaded (under the 4 MB response limit). */
export async function GET(request: Request) {
  const url = new URL(request.url).searchParams.get("url");
  if (!url) return Response.json({ error: "No image link." }, { status: 400 });
  try {
    const img = await safeFetch(url, { maxBytes: 4_000_000, accept: /^image\/(jpeg|png|webp|gif|avif)/i });
    return new Response(new Uint8Array(img.bytes), { headers: { "content-type": img.type, "cache-control": "private, max-age=3600" } });
  } catch (e) {
    const msg = e instanceof NewsError ? e.message : "Couldn't load that image.";
    return Response.json({ error: msg }, { status: 422 });
  }
}
