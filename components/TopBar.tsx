import { useState } from "react";
import { track } from "@/lib/analytics";
import { downloadPost } from "@/lib/export";
import { isFirstVisit, renderStateOf, useEditor } from "@/lib/store";
import { templateInfo } from "@/lib/templates";
import LogoMark from "./LogoMark";
import NewsButton from "./NewsButton";
import SizePicker from "./SizePicker";
import TemplatePicker from "./TemplatePicker";
import UndoButtons from "./UndoButtons";

/**
 * Phones: logo + Brand + Download on the first row, template and size on the second.
 * Tablets and up: everything on one row.
 */
/** Download the current post (PNG or zip); `busy` while it renders. */
export function useDownload() {
  const [busy, setBusy] = useState(false);
  const download = async () => {
    setBusy(true);
    const s = useEditor.getState();
    try {
      const count = await downloadPost(renderStateOf(s), s.fmt);
      s.showToast(count > 1 ? `Saved ${count} slides as a .zip. Check your downloads.` : "Saved! Check your downloads.");
      track("download", { template: s.fmt, size: s.size, scale: s.brand.exportScale });
    } catch {
      s.showToast("Could not save the file. Try again.");
    } finally {
      setBusy(false);
    }
  };
  return { busy, download };
}

/** Tablet and desktop top bar (phones use the app shell's own bar). */
export default function TopBar() {
  const { busy, download } = useDownload();
  const [picking, setPicking] = useState(isFirstVisit);
  const fmt = useEditor((s) => s.fmt);
  const mode = useEditor((s) => s.mode);
  const setMode = useEditor((s) => s.setMode);

  return (
    <header className="flex flex-wrap items-center gap-x-3 gap-y-2.5 border-b border-line bg-bg pt-[max(12px,env(safe-area-inset-top,0px))] pr-[max(16px,env(safe-area-inset-right,0px))] pb-3 pl-[max(16px,env(safe-area-inset-left,0px))] md:flex-nowrap md:gap-x-4">
      <h1 className="m-0 flex items-center gap-2 font-display text-[26px] font-normal leading-none tracking-[.03em] uppercase md:text-[30px]">
        <LogoMark className="size-6 md:size-7" id="bar-logo" />
        Spliceroom
        <span className="sr-only"> meme, poster and Instagram post maker</span>
      </h1>

      <div className="order-last flex w-full min-w-0 items-center gap-2 md:order-none md:w-auto md:flex-1">
        <button
          type="button"
          onClick={() => setPicking(true)}
          aria-label={`Template: ${templateInfo(fmt).name}. Change template`}
          className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-lg border border-line bg-raise px-3 text-left hover:border-muted md:max-w-xs md:flex-none"
        >
          <GridIcon />
          <span className="min-w-0 flex-1 truncate">
            <span className="hidden text-muted sm:inline">Template: </span>
            <span className="font-semibold">{templateInfo(fmt).name}</span>
          </span>
          <span aria-hidden className="text-muted">
            ▾
          </span>
        </button>
        <SizePicker />
        <NewsButton />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <UndoButtons />
        <button
          type="button"
          aria-pressed={mode === "brand"}
          className="btn btn-ghost min-h-11 aria-pressed:border-accent"
          onClick={() => setMode(mode === "brand" ? "slide" : "brand")}
        >
          <span>
            <span className="hidden lg:inline">My </span>Profile
          </span>
        </button>
        <button type="button" className="btn btn-primary min-h-11" disabled={busy} onClick={download}>
          {busy ? (
            "Preparing…"
          ) : (
            <span>
              Download<span className="hidden lg:inline"> post</span>
            </span>
          )}
        </button>
      </div>

      <TemplatePicker open={picking} onClose={() => setPicking(false)} />
    </header>
  );
}

function GridIcon() {
  return (
    <svg aria-hidden width="16" height="16" viewBox="0 0 16 16" className="flex-none text-accent">
      <rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor" />
      <rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity=".55" />
      <rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity=".55" />
      <rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" />
    </svg>
  );
}
