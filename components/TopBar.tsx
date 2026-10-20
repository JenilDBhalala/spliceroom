import { useState } from "react";
import { downloadPost } from "@/lib/export";
import { useEditor } from "@/lib/store";
import FormatTabs from "./FormatTabs";

export default function TopBar() {
  const [busy, setBusy] = useState(false);

  const download = async () => {
    setBusy(true);
    const { brand, posts, fmt, showToast } = useEditor.getState();
    try {
      await downloadPost({ brand, posts }, fmt);
    } catch {
      showToast("Could not save the file. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <header className="flex flex-wrap items-center gap-x-[22px] gap-y-3 border-b border-line bg-bg py-3 pr-[max(16px,env(safe-area-inset-right,0px))] pl-[max(16px,env(safe-area-inset-left,0px))]">
      <div className="flex items-center gap-2 font-display text-[30px] leading-none tracking-[.03em] uppercase">
        <i className="inline-block size-3 rounded-full bg-accent" />
        Spliceroom
      </div>
      <FormatTabs />
      <div className="flex-1" />
      <button
        type="button"
        className="btn btn-ghost"
        onClick={() => {
          const { mode, setMode } = useEditor.getState();
          setMode(mode === "brand" ? "slide" : "brand");
        }}
      >
        Brand &amp; profile
      </button>
      <button type="button" className="btn btn-primary" disabled={busy} onClick={download}>
        {busy ? "Preparing…" : "Download post"}
      </button>
    </header>
  );
}
