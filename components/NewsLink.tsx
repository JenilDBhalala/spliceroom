import { useState } from "react";
import { track } from "@/lib/analytics";
import { SparkIcon } from "./NewsButton";
import NewsFinder from "./NewsFinder";

/** A featured card that opens the news finder (search, trending or a pasted link). `onDone` runs after a successful fill. */
export default function NewsLink({ onDone, from }: { onDone?: () => void; from: string }) {
  const [finding, setFinding] = useState(false);
  return (
    <>
      <div className="flex flex-col gap-3 rounded-xl border border-accent/50 bg-accent/10 p-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="m-0 flex items-center gap-1.5 text-[15px] font-bold">
            <SparkIcon className="size-4 text-accent" />
            Cinema news post, made with AI
          </p>
          <p className="m-0 text-[12.5px] leading-snug text-muted">
            Pick what&apos;s trending in Hollywood and Indian cinema, search a few words or paste a link. We write the headline and slides and add the story&apos;s photos.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary flex-none justify-center"
          onClick={() => {
            setFinding(true);
            track("news_open", { from });
          }}
        >
          Find news
        </button>
      </div>
      <NewsFinder open={finding} onClose={() => setFinding(false)} onMade={onDone} />
    </>
  );
}
