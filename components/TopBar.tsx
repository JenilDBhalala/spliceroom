import { useState } from "react";
import { downloadPost } from "@/lib/export";
import { renderStateOf, useEditor } from "@/lib/store";
import { templateInfo } from "@/lib/templates";
import SizePicker from "./SizePicker";
import TemplatePicker from "./TemplatePicker";

/**
 * Phones: logo + Brand + Download on the first row, template and size on the second.
 * Tablets and up: everything on one row.
 */
export default function TopBar() {
  const [busy, setBusy] = useState(false);
  const [picking, setPicking] = useState(false);
  const fmt = useEditor((s) => s.fmt);
  const mode = useEditor((s) => s.mode);
  const setMode = useEditor((s) => s.setMode);

  const download = async () => {
    setBusy(true);
    const s = useEditor.getState();
    try {
      await downloadPost(renderStateOf(s), s.fmt);
    } catch {
      s.showToast("Could not save the file. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <header className="flex flex-wrap items-center gap-x-3 gap-y-2.5 border-b border-line bg-bg pt-[max(12px,env(safe-area-inset-top,0px))] pr-[max(16px,env(safe-area-inset-right,0px))] pb-3 pl-[max(16px,env(safe-area-inset-left,0px))] md:flex-nowrap md:gap-x-4">
      <div className="flex items-center gap-2 font-display text-[26px] leading-none tracking-[.03em] uppercase md:text-[30px]">
        <i className="inline-block size-3 rounded-full bg-accent" />
        Spliceroom
      </div>

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
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          aria-pressed={mode === "brand"}
          className="btn btn-ghost min-h-11 aria-pressed:border-accent"
          onClick={() => setMode(mode === "brand" ? "slide" : "brand")}
        >
          <span>
            Brand<span className="hidden lg:inline"> &amp; profile</span>
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
