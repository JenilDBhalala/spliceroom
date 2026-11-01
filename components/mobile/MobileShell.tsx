import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Brand } from "@/types/post";
import { useEditor, useSlides } from "@/lib/store";
import { SIZE_OPTIONS, templateInfo } from "@/lib/templates";
import { useInstallPrompt } from "@/lib/useInstallPrompt";
import Segmented from "@/components/fields/Segmented";
import LogoMark from "@/components/LogoMark";
import BrandPanel from "@/components/panels/BrandPanel";
import StyleSection from "@/components/panels/StyleSection";
import { Note } from "@/components/panels/ui";
import Preview from "@/components/Preview";
import { SlideFields, useStyleTarget } from "@/components/SlidePanel";
import SlideStrip from "@/components/SlideStrip";
import TemplatePicker from "@/components/TemplatePicker";
import { useDownload } from "@/components/TopBar";
import BottomSheet, { type SheetSnap } from "./BottomSheet";

type Tab = "edit" | "style" | "size" | "brand";

const buzz = () => navigator.vibrate?.(8);

/**
 * Phone layout, built like an app: a fixed screen with a slim top bar, the post filling the middle,
 * a bottom sheet for controls and a tab bar. Nothing scrolls except the sheet's contents.
 */
export default function MobileShell() {
  const [tab, setTab] = useState<Tab | null>(null);
  const [snap, setSnap] = useState<SheetSnap>("half");
  const [picking, setPicking] = useState(false);
  const fmt = useEditor((s) => s.fmt);
  const layerSel = useEditor((s) => s.layerSel);
  const { slides } = useSlides();
  const style = useStyleTarget();
  const { busy, download } = useDownload();
  const install = useInstallPrompt();

  // Tapping a canvas layer on the preview opens its settings.
  const lastSel = useRef(layerSel);
  useEffect(() => {
    if (layerSel && layerSel !== lastSel.current) setTab("edit");
    lastSel.current = layerSel;
  }, [layerSel]);

  const open = (t: Tab) => {
    buzz();
    if (tab === t) return setTab(null);
    setTab(t);
  };
  const tabs: { id: Tab; label: string; icon: ReactNode; hidden?: boolean }[] = [
    { id: "edit", label: "Edit", icon: <EditIcon /> },
    { id: "style", label: "Style", icon: <StyleIcon />, hidden: !style.key },
    { id: "size", label: "Size", icon: <SizeIcon /> },
    { id: "brand", label: "Brand", icon: <BrandIcon /> },
  ];
  const sheetTitle = { edit: "Edit", style: "Text style", size: "Size", brand: "Brand" } as const;

  return (
    <div className="app-chrome fixed inset-0 flex flex-col bg-bg">
      <header className="flex flex-none items-center gap-2 border-b border-line px-[max(12px,env(safe-area-inset-left,0px))] pt-[max(10px,env(safe-area-inset-top,0px))] pb-2.5">
        <LogoMark className="size-8 flex-none" id="m-logo" />
        <h1 className="sr-only">Spliceroom meme, poster and Instagram post maker</h1>
        <button
          type="button"
          onClick={() => setPicking(true)}
          aria-label={`Template: ${templateInfo(fmt).name}. Change template`}
          className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-line bg-raise px-3.5"
        >
          <span className="truncate font-semibold">{templateInfo(fmt).name}</span>
          <span aria-hidden className="text-xs text-muted">
            ▾
          </span>
        </button>
        {install && (
          <button type="button" className="btn btn-ghost min-h-11 px-3" onClick={install}>
            Install
          </button>
        )}
        <button type="button" className="btn btn-primary min-h-11 px-3.5" disabled={busy} onClick={download} aria-label="Download post">
          {busy ? "…" : <DownloadIcon />}
        </button>
      </header>

      <main className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 items-center justify-center p-2.5 [container-type:size]">
          <Preview fit />
        </div>
        {/* The strip hides while a sheet is open so the preview keeps its room. */}
        {!tab && (slides.length > 1 || fmt === "list" || fmt === "news" || fmt === "lessons") ? (
          <div className="flex flex-none justify-center px-2">
            <SlideStrip />
          </div>
        ) : null}
      </main>

      {tab && (
        <BottomSheet title={sheetTitle[tab]} snap={snap} onSnap={setSnap} onClose={() => setTab(null)}>
          {tab === "edit" && <SlideFields withStyle={false} />}
          {tab === "style" && style.key && <StyleSection key={style.key} postKey={style.key} note={style.note} flat />}
          {tab === "size" && <SizeSheet />}
          {tab === "brand" && <BrandPanel onDone={() => setTab(null)} />}
        </BottomSheet>
      )}

      <nav
        aria-label="Editor sections"
        className="grid flex-none border-t border-line bg-bg pb-[env(safe-area-inset-bottom,0px)]"
        style={{ gridTemplateColumns: `repeat(${tabs.filter((t) => !t.hidden).length}, minmax(0, 1fr))` }}
      >
        {tabs
          .filter((t) => !t.hidden)
          .map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={tab === t.id}
              onClick={() => open(t.id)}
              className="flex min-h-14 cursor-pointer flex-col items-center justify-center gap-1 text-[11px] font-semibold text-muted aria-pressed:text-accent"
            >
              {t.icon}
              {t.label}
            </button>
          ))}
      </nav>

      <TemplatePicker open={picking} onClose={() => setPicking(false)} />
    </div>
  );
}

const QUALITY = [
  ["2", "Sharper (2×)"],
  ["1", "Instagram size"],
] as const;

/** Post shape as big tap targets, plus download quality. */
function SizeSheet() {
  const size = useEditor((s) => s.size);
  const setSize = useEditor((s) => s.setSize);
  const scale = useEditor((s) => s.brand.exportScale);
  const update = useEditor((s) => s.update);
  return (
    <>
      <div role="radiogroup" aria-label="Post size" className="grid grid-cols-3 gap-2">
        {SIZE_OPTIONS.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={o.id === size}
            onClick={() => {
              buzz();
              setSize(o.id);
            }}
            className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-line bg-raise px-2 py-3.5 aria-checked:border-accent aria-checked:ring-1 aria-checked:ring-accent"
          >
            <i
              aria-hidden
              className="block rounded-[3px] border-2 border-current text-muted"
              style={o.id === "portrait" ? { width: 28, height: 35 } : o.id === "square" ? { width: 32, height: 32 } : { width: 22, height: 39 }}
            />
            <span className="text-base font-semibold tabular-nums">{o.label}</span>
            <span className="text-center text-[11px] leading-tight text-muted">{o.hint.split(" · ")[0]}</span>
          </button>
        ))}
      </div>
      <Segmented
        label="Download quality"
        value={String(scale) as "1" | "2"}
        options={QUALITY}
        onChange={(v) => update(["brand"], { exportScale: Number(v) as Brand["exportScale"] })}
      />
      <Note>Sharper keeps text crisp when zoomed in; Instagram scales it down on upload.</Note>
    </>
  );
}

const icon = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const EditIcon = () => (
  <svg aria-hidden {...icon}>
    <path d="M4 20h4L19 9l-4-4L4 16v4z" />
    <path d="M13.5 6.5l4 4" />
  </svg>
);
const StyleIcon = () => (
  <svg aria-hidden {...icon}>
    <path d="M4 19l5-14h2l5 14" />
    <path d="M6.5 13h7" />
    <path d="M17 19h4" />
  </svg>
);
const SizeIcon = () => (
  <svg aria-hidden {...icon}>
    <rect x="3" y="5" width="9" height="12" rx="1.5" />
    <rect x="14" y="8" width="7" height="12" rx="1.5" />
  </svg>
);
const BrandIcon = () => (
  <svg aria-hidden {...icon}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
  </svg>
);
const DownloadIcon = () => (
  <svg aria-hidden {...icon} width={20} height={20}>
    <path d="M12 4v11" />
    <path d="M7 10l5 5 5-5" />
    <path d="M5 20h14" />
  </svg>
);
