import { useState, type ReactNode } from "react";
import type { Brand } from "@/types/post";
import { useConsentAnswered } from "@/lib/useConsentAnswered";
import { isFirstVisit, useEditor, useSlides } from "@/lib/store";
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
import UndoButtons from "@/components/UndoButtons";
import BottomSheet, { type SheetSnap } from "./BottomSheet";

type Tab = "edit" | "style" | "size" | "brand";

const buzz = () => navigator.vibrate?.(8);

/**
 * Phone layout, built like an app: a fixed screen with a slim top bar, the post filling the middle,
 * a bottom sheet for controls and a tab bar. Nothing scrolls except the sheet's contents.
 */
export default function MobileShell() {
  const [openTab, setOpenTab] = useState<Tab | null>(null);
  const [snap, setSnap] = useState<SheetSnap>("half");
  // First visit: start by asking what to make, then point at the Edit tab once.
  const [picking, setPicking] = useState(isFirstVisit);
  const [coach, setCoach] = useState(isFirstVisit);
  const fmt = useEditor((s) => s.fmt);
  const mode = useEditor((s) => s.mode);
  const setMode = useEditor((s) => s.setMode);
  const { slides } = useSlides();
  const style = useStyleTarget();
  const { busy, download } = useDownload();
  const install = useInstallPrompt();
  const consentAnswered = useConsentAnswered();

  // "Edit my profile" buttons inside templates ask for the profile; here that's a tab.
  const tab: Tab | null = mode === "brand" ? "brand" : openTab;
  const setTab = (t: Tab | null) => {
    if (mode === "brand") setMode("slide");
    setOpenTab(t);
  };

  const open = (t: Tab) => {
    buzz();
    setCoach(false);
    if (tab === t) return setTab(null);
    setTab(t);
  };
  const tabs: { id: Tab; label: string; icon: ReactNode; hidden?: boolean }[] = [
    { id: "edit", label: "Edit", icon: <EditIcon /> },
    { id: "style", label: "Style", icon: <StyleIcon />, hidden: !style.key },
    { id: "size", label: "Size", icon: <SizeIcon /> },
    { id: "brand", label: "Profile", icon: <BrandIcon /> },
  ];
  const sheetTitle = { edit: "Edit", style: "Text style", size: "Size", brand: "Profile" } as const;

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
          <GridIcon />
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
        <UndoButtons compact />
        <button type="button" className="btn btn-primary min-h-11 gap-1.5 px-3.5" disabled={busy} onClick={download} aria-label="Save post to your device">
          <DownloadIcon />
          {busy ? "…" : "Save"}
        </button>
      </header>

      <main className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 items-center justify-center p-2.5 [container-type:size]">
          {/* Tapping a canvas layer opens its settings once the finger lifts; dragging doesn't. */}
          <Preview fit onLayerTap={() => setTab("edit")} />
        </div>
        {/* The strip hides while a sheet is open so the preview keeps its room. */}
        {!tab && (slides.length > 1 || fmt === "list" || fmt === "news" || fmt === "lessons") ? (
          <div className="flex flex-none justify-center px-2">
            <SlideStrip />
          </div>
        ) : null}
      </main>

      {coach && consentAnswered && !tab && !picking && (
        <div role="note" className="pointer-events-none absolute inset-x-3 bottom-[calc(64px+env(safe-area-inset-bottom,0px))] z-10 flex">
          <div className="pointer-events-auto relative flex w-full items-start gap-3 rounded-2xl bg-fg p-3.5 pr-3 text-[13.5px] leading-snug text-bg shadow-[0_10px_34px_rgba(0,0,0,.5)]">
            <p className="m-0">
              Tap <b>Edit</b> below to change the words and photos. When it looks good, tap <b>Save</b> at the top.
            </p>
            <button type="button" className="-my-1 min-h-9 flex-none cursor-pointer rounded-full bg-bg px-3 text-[13px] font-bold text-fg" onClick={() => setCoach(false)}>
              Got it
            </button>
            {/* Points at the Edit tab. */}
            <i aria-hidden className="absolute -bottom-1.5 size-3 rotate-45 bg-fg" style={{ left: `calc(100vw / ${tabs.filter((t) => !t.hidden).length * 2} - 18px)` }} />
          </div>
        </div>
      )}

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
const GridIcon = () => (
  <svg aria-hidden width="14" height="14" viewBox="0 0 16 16" className="flex-none text-accent">
    <rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor" />
    <rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity=".55" />
    <rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity=".55" />
    <rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" />
  </svg>
);
const DownloadIcon = () => (
  <svg aria-hidden {...icon} width={20} height={20}>
    <path d="M12 4v11" />
    <path d="M7 10l5 5 5-5" />
    <path d="M5 20h14" />
  </svg>
);
