import { useEffect, useRef, useState } from "react";
import { fillFromLink, fillFromStory } from "@/lib/newsClient";
import AiSettings from "./AiSettings";
import RemoteImg from "./RemoteImg";

interface Story {
  id: string;
  title: string;
  sources: { site: string; url: string }[];
  time: number;
  image: string | null;
}

type Region = "all" | "hollywood" | "indian";
const REGIONS: [Region, string][] = [
  ["all", "All"],
  ["hollywood", "Hollywood"],
  ["indian", "Indian"],
];

type Sort = "top" | "new";
const SORTS: [Sort, string][] = [
  ["top", "Top"],
  ["new", "Newest"],
];

/** What's being made: the story's title and outlets, or a pasted link. */
interface Making {
  title: string;
  sites: string[];
}

function ago(t: number) {
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 60) return `${Math.max(1, m)} min ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h} h ago` : `${Math.round(h / 24)} d ago`;
}

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "the link";
  }
};

/**
 * Find cinema news: what's trending across Hollywood and Indian film sites, the newest stories, or stories matching a few words.
 * "Make post" reads the story from up to three outlets and fills the News story post; a link typed in the search box fills it from that article.
 */
export default function NewsFinder({ open, onClose, onMade }: { open: boolean; onClose: () => void; onMade?: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [q, setQ] = useState("");
  const [asked, setAsked] = useState("");
  const [region, setRegion] = useState<Region>("all");
  const [sort, setSort] = useState<Sort>("top");
  const [stories, setStories] = useState<Story[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [making, setMaking] = useState<Making | null>(null);
  const [photos, setPhotos] = useState(false);
  const isLink = /^https?:\/\/\S+$/i.test(q.trim());

  useEffect(() => {
    const d = ref.current!;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let live = true;
    fetch(`/api/news/feed?region=${region}&sort=${sort}&q=${encodeURIComponent(asked)}`)
      .then((r) => r.json())
      .then((d: { stories?: Story[]; error?: string }) => {
        if (!live) return;
        setStories(d.stories ?? []);
        setError(d.error ?? null);
      })
      .catch(() => live && setError("Couldn't reach the server. Check your connection."));
    return () => {
      live = false;
    };
  }, [open, region, sort, asked]);

  const make = async (what: Making, fill: (onPhotos: () => void) => Promise<string | null>) => {
    setMaking(what);
    setPhotos(false);
    setError(null);
    const err = await fill(() => setPhotos(true));
    setMaking(null);
    if (err) return setError(err);
    onClose();
    onMade?.();
  };

  // A new search, region or order shows the loading state until its stories arrive.
  const search = (next: { q?: string; region?: Region; sort?: Sort }) => {
    setStories(null);
    setError(null);
    if (next.q !== undefined) setAsked(next.q);
    if (next.region) setRegion(next.region);
    if (next.sort) setSort(next.sort);
  };

  return (
    <dialog
      ref={ref}
      aria-labelledby="finder-title"
      onClose={onClose}
      // While a post is being made, Escape and outside taps don't close the finder.
      onCancel={(e) => making && e.preventDefault()}
      onClick={(e) => e.target === ref.current && !making && onClose()}
      className="m-0 h-dvh max-h-none w-full max-w-none bg-panel p-0 text-fg backdrop:bg-black/70 md:m-auto md:h-auto md:max-h-[86vh] md:max-w-2xl md:rounded-2xl md:border md:border-line"
    >
      {making && <MakingProgress making={making} photos={photos} />}
      <div className="sticky top-0 z-10 flex flex-col gap-3 border-b border-line bg-panel px-4 pt-[max(14px,env(safe-area-inset-top,0px))] pb-3.5 md:px-6">
        <div className="flex items-center justify-between gap-3">
          <h2 id="finder-title" className="m-0 font-display text-2xl leading-none tracking-[.02em] uppercase">
            Find cinema news
          </h2>
          <button type="button" className="btn btn-ghost min-h-10" onClick={onClose} disabled={!!making}>
            Close
          </button>
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (making) return;
            const text = q.trim();
            if (isLink) make({ title: text, sites: [hostOf(text)] }, (onPhotos) => fillFromLink(text, onPhotos));
            else search({ q: text });
          }}
        >
          <input
            type="search"
            aria-label="Describe the news or paste an article link"
            placeholder="Dune 3 cast, Ramayana box office, or a link"
            className="input min-w-0 flex-1"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              // Clearing the box goes back to what's trending.
              if (!e.target.value && asked) search({ q: "" });
            }}
          />
          <button type="submit" className="btn btn-primary flex-none" disabled={!!making}>
            {isLink ? "Make post" : "Search"}
          </button>
        </form>
        <div role="radiogroup" aria-label="Which cinema" className="flex gap-1 rounded-lg border border-line bg-raise p-1">
          {REGIONS.map(([id, name]) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={region === id}
              onClick={() => region !== id && search({ region: id })}
              className="min-h-9 flex-1 cursor-pointer rounded-md px-2 text-[13px] font-semibold text-muted hover:text-fg aria-checked:bg-accent aria-checked:text-on-accent"
            >
              {name}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-3 px-4 pt-4 pb-[calc(28px+env(safe-area-inset-bottom,0px))] md:px-6">
        <AiSettings />
        <div className="flex items-center justify-between gap-3">
          <h3 className="m-0 text-[11px] font-bold tracking-[.12em] text-muted uppercase">
            {asked ? `Stories about “${asked}”` : sort === "new" ? "Latest news" : "Trending now"}
          </h3>
          <div role="radiogroup" aria-label="Order" className="flex gap-0.5 rounded-md border border-line bg-raise p-0.5">
            {SORTS.map(([id, name]) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={sort === id}
                onClick={() => sort !== id && search({ sort: id })}
                className="min-h-8 cursor-pointer rounded px-2.5 text-[12px] font-semibold text-muted hover:text-fg aria-checked:bg-fg aria-checked:text-bg"
              >
                {name}
              </button>
            ))}
          </div>
        </div>
        {error && (
          <p role="alert" className="m-0 text-[13px] text-[#ff8a80]">
            {error}
          </p>
        )}
        {!stories && !error && <StorySkeletons />}
        {stories?.length === 0 && (
          <p className="m-0 text-[13px] text-muted">
            {asked ? "Nothing in the last few days matches that. Try fewer or different words." : "No stories right now. Try again in a minute."}
          </p>
        )}
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {stories?.map((s) => (
            <li key={s.id} className="flex gap-3 rounded-xl border border-line bg-raise p-2.5">
              {s.image ? (
                <RemoteImg key={s.image} src={s.image} className="h-20 w-16 flex-none rounded-md bg-black object-cover" />
              ) : (
                <span className="h-20 w-16 flex-none rounded-md bg-black" />
              )}
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="m-0 text-[13.5px] leading-snug font-semibold">{s.title}</p>
                <p className="m-0 text-[12px] text-muted">
                  {/* Each outlet links to its own article, to read before posting. */}
                  {s.sources.map((x, i) => (
                    <span key={x.url}>
                      {i > 0 && ", "}
                      <a
                        href={x.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Read on ${x.site} (opens in a new tab)`}
                        className="text-fg/80 underline decoration-line underline-offset-2 hover:text-accent"
                      >
                        {x.site}
                      </a>
                    </span>
                  ))}{" "}
                  ·{" "}
                  <time dateTime={new Date(s.time).toISOString()} title={new Date(s.time).toLocaleString()}>
                    {ago(s.time)}
                  </time>
                </p>
                <button
                  type="button"
                  className="btn btn-small btn-primary mt-auto self-start"
                  disabled={!!making}
                  onClick={() => {
                    const from = s.sources.slice(0, 3);
                    make({ title: s.title, sites: from.map((x) => x.site) }, (onPhotos) =>
                      fillFromStory(
                        from.map((x) => x.url),
                        onPhotos,
                      ),
                    );
                  }}
                >
                  Make post
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </dialog>
  );
}

/** Grey cards in the shape of stories while the feeds load. */
function StorySkeletons() {
  return (
    <ul aria-label="Loading the latest cinema news" className="m-0 flex list-none flex-col gap-2 p-0">
      {[0, 1, 2, 3, 4].map((i) => (
        <li
          key={i}
          className="flex gap-3 rounded-xl border border-line bg-raise p-2.5 motion-safe:animate-pulse"
          style={{ animationDelay: `${i * 120}ms` }}
        >
          <span className="h-20 w-16 flex-none rounded-md bg-line" />
          <span className="flex flex-1 flex-col gap-2 pt-1">
            <span className="h-3.5 w-[92%] rounded bg-line" />
            <span className="h-3.5 w-[70%] rounded bg-line" />
            <span className="h-3 w-[40%] rounded bg-line/70" />
            <span className="mt-auto h-7 w-24 rounded-md bg-line/70" />
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Covers the finder while a post is made. The server reads and writes in one request, so those steps advance on typical
 * timings; the photo step starts for real when the text arrives.
 */
function MakingProgress({ making, photos }: { making: Making; photos: boolean }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = [setTimeout(() => setStep(1), 2500), setTimeout(() => setStep(2), 8000)];
    return () => t.forEach(clearTimeout);
  }, []);
  const at = photos ? 3 : step;
  const steps = [
    `Reading the story from ${making.sites.join(", ")}`,
    "Writing headlines and slides with AI",
    "Finding the best photos",
    "Adding a photo to each slide",
  ];
  return (
    <div className="fixed inset-0 z-20 grid place-items-center bg-panel/90 p-6 backdrop-blur-md">
      <div role="status" aria-live="polite" className="flex w-full max-w-sm flex-col gap-5">
        <div className="flex flex-col gap-2.5">
          <Spark />
          <p className="m-0 font-display text-2xl leading-none tracking-[.02em] uppercase">Making your post</p>
          <p className="m-0 line-clamp-2 text-[13px] break-words text-muted">{making.title}</p>
        </div>
        <ol className="m-0 flex list-none flex-col gap-3 p-0">
          {steps.map((s, i) => (
            <li key={s} className={`flex items-center gap-3 text-[13.5px] ${i > at ? "text-muted/60" : i === at ? "font-semibold" : "text-muted"}`}>
              <span aria-hidden className="grid size-6 flex-none place-items-center">
                {i < at ? (
                  <svg viewBox="0 0 16 16" className="size-4 text-accent">
                    <path d="M3 8.5 6.5 12 13 4.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : i === at ? (
                  <span className="size-4 rounded-full border-2 border-accent border-t-transparent motion-safe:animate-spin" />
                ) : (
                  <span className="size-2 rounded-full bg-line" />
                )}
              </span>
              <span>
                {s}
                {i === at ? "…" : ""}
              </span>
            </li>
          ))}
        </ol>
        <div className="h-1 overflow-hidden rounded-full bg-line">
          <div className="h-full rounded-full bg-accent transition-[width] duration-700" style={{ width: `${[15, 42, 68, 90][at]}%` }} />
        </div>
        <p className="m-0 text-[12px] text-muted">This usually takes 10 to 20 seconds.</p>
      </div>
    </div>
  );
}

function Spark() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="size-7 text-accent motion-safe:animate-[spin_4s_linear_infinite]">
      <path d="M8 0.5 9.6 6.4 15.5 8 9.6 9.6 8 15.5 6.4 9.6 0.5 8 6.4 6.4Z" fill="currentColor" />
    </svg>
  );
}
