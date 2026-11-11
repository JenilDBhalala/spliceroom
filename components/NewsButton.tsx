import { useState } from "react";
import { track } from "@/lib/analytics";
import NewsFinder from "./NewsFinder";

export function SparkIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={`flex-none ${className}`}>
      <path d="M8 0.5 9.6 6.4 15.5 8 9.6 9.6 8 15.5 6.4 9.6 0.5 8 6.4 6.4Z" fill="currentColor" />
      <path d="M13.2 0.8 13.8 2.2 15.2 2.8 13.8 3.4 13.2 4.8 12.6 3.4 11.2 2.8 12.6 2.2Z" fill="currentColor" opacity=".6" />
    </svg>
  );
}

/** Always in the top bar, so the news maker is one tap away from any template. `compact` is the phone label. */
export default function NewsButton({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-label="Make a cinema news post with AI"
        className="btn btn-ghost min-h-11 gap-1.5 border-accent/70 px-3 text-accent hover:border-accent"
        onClick={() => {
          setOpen(true);
          track("news_open", { from: "top_bar" });
        }}
      >
        <SparkIcon />
        {compact ? "News" : "AI news post"}
      </button>
      <NewsFinder open={open} onClose={() => setOpen(false)} />
    </>
  );
}
