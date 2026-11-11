import { NewsError, geminiModels, ownAi } from "@/lib/news";

/** Checks a visitor's own Gemini key (sent in a header, never stored) and lists the models it can use. */
export async function POST(request: Request) {
  const own = ownAi(request);
  if (!own) return Response.json({ error: "That doesn't look like a Gemini API key." }, { status: 400 });
  try {
    return Response.json({ models: await geminiModels(own.key) });
  } catch (e) {
    if (e instanceof NewsError) return Response.json({ error: e.message }, { status: 422 });
    return Response.json({ error: "Couldn't reach Gemini. Try again." }, { status: 502 });
  }
}
