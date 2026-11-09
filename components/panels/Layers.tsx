import { useEffect, useRef, useState } from "react";
import type { ImageLayer, Layer, TextLayer } from "@/types/post";
import { toastUndo } from "@/lib/history";
import { useEditor, useSlideLayers } from "@/lib/store";
import ColorField from "@/components/fields/ColorField";
import FontPicker from "@/components/fields/FontPicker";
import ImageSlot from "@/components/fields/ImageSlot";
import Segmented from "@/components/fields/Segmented";
import Slider from "@/components/fields/Slider";
import TextField from "@/components/fields/TextField";
import Toggle from "@/components/fields/Toggle";
import TypeControls from "@/components/fields/TypeControls";
import { Group, HIGHLIGHT_TIP } from "./ui";

/** Emoji stickers meme pages use most: reactions, cinema, arrows and marks. */
const STICKERS = ["😂", "💀", "😭", "🤣", "😱", "🤯", "😎", "🥲", "🤡", "👀", "🔥", "💯", "❤️", "💔", "🙏", "👑", "🏆", "⭐", "🍿", "🎬", "🎥", "📽️", "🎞️", "📺", "👇", "👉", "➡️", "⬆️", "✅", "❌", "⚠️", "❓"];

/** + Text, + Photo and + Sticker (an emoji grid that opens below the buttons). */
export function AddButtons() {
  const addLayer = useEditor((s) => s.addLayer);
  const [stickers, setStickers] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-2">
        <button type="button" className="btn justify-center" onClick={() => addLayer("text")}>
          + Text
        </button>
        <button type="button" className="btn justify-center" onClick={() => addLayer("image")}>
          + Photo
        </button>
        <button type="button" className="btn justify-center" aria-expanded={stickers} onClick={() => setStickers(!stickers)}>
          + Sticker
        </button>
      </div>
      {stickers && (
        <div role="group" aria-label="Stickers" className="grid grid-cols-8 gap-1 rounded-lg border border-line bg-raise p-1.5">
          {STICKERS.map((e) => (
            <button
              key={e}
              type="button"
              aria-label={`Add ${e}`}
              className="grid aspect-square cursor-pointer place-items-center rounded-md text-[22px] hover:bg-line"
              onClick={() => {
                addLayer("sticker", e);
                setStickers(false);
              }}
            >
              {e}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const nameOf = (l: Layer) => (l.kind === "text" ? l.text.replace(/\*/g, "") || "Empty text" : "Photo");

/** The current slide's layers, front first; tap one to edit it. `children` goes last (the canvas background row). */
export function LayerList({ children }: { children?: React.ReactNode }) {
  const { layers } = useSlideLayers();
  const sel = useEditor((s) => s.layerSel);
  const setLayerSel = useEditor((s) => s.setLayerSel);
  if (!layers.length && !children) return null;
  return (
    <ol className="m-0 flex list-none flex-col gap-1 p-0">
      {/* Top of the list is the front of the slide. */}
      {[...layers].reverse().map((l) => (
        <li key={l.id}>
          <button
            type="button"
            aria-pressed={l.id === sel}
            onClick={() => setLayerSel(l.id)}
            className="flex min-h-11 w-full cursor-pointer items-center gap-2.5 rounded-lg border border-line bg-raise px-3 text-left hover:border-muted aria-pressed:border-accent aria-pressed:ring-1 aria-pressed:ring-accent"
          >
            <span aria-hidden className="grid size-6 flex-none place-items-center rounded bg-line text-xs font-bold">
              {l.kind === "text" ? "T" : "▣"}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm">{nameOf(l)}</span>
          </button>
        </li>
      ))}
      {children}
    </ol>
  );
}

/** "Add to this slide" on templates: the add buttons and what was added. */
export function AddToSlide() {
  return (
    <Group title="Add to this slide">
      <AddButtons />
      <LayerList />
    </Group>
  );
}

/** Settings for the selected layer of the current slide, or nothing when none is selected. */
export function LayerEditor() {
  const { path, layers } = useSlideLayers();
  const sel = useEditor((s) => s.layerSel);
  const index = layers.findIndex((l) => l.id === sel);
  if (index < 0) return null;
  const layer = layers[index];
  return <Editor key={layer.id} layer={layer} path={[...path, index]} index={index} count={layers.length} />;
}

type EditorProps<L extends Layer> = { layer: L; path: (string | number)[] };

function Editor({ layer, path, index, count }: EditorProps<Layer> & { index: number; count: number }) {
  const ref = useRef<HTMLDivElement>(null);
  // Bring the settings into view when a layer is picked (on phones it can be below the list).
  useEffect(() => {
    ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, []);
  const sticker = layer.kind === "text" && isEmoji(layer.text);
  return (
    <div ref={ref} className="flex flex-col">
      <Group title={layer.kind === "image" ? "Selected photo" : sticker ? "Selected sticker" : "Selected text"}>
        {layer.kind === "text" ? (
          sticker ? (
            <StickerFields layer={layer} path={path} />
          ) : (
            <TextFields layer={layer} path={path} />
          )
        ) : (
          <ImageFields layer={layer} path={path} />
        )}
        <CommonFields layer={layer} path={path} index={index} count={count} />
      </Group>
    </div>
  );
}

const isEmoji = (t: string) => /^\p{Extended_Pictographic}[\p{Extended_Pictographic}‍️\s]*$/u.test(t.trim());

const ALIGNS = [
  ["left", "Left"],
  ["center", "Center"],
  ["right", "Right"],
] as const;
const EFFECTS = [
  ["none", "None"],
  ["outline", "Outline"],
  ["shadow", "Shadow"],
  ["glow", "Glow"],
  ["box", "Box"],
] as const;
const EFFECT_COLOR: Record<TextLayer["effect"], string> = { none: "", outline: "Outline color", shadow: "Shadow color", glow: "Glow color", box: "Box color" };
const SHAPES = [
  ["rect", "Square"],
  ["rounded", "Rounded"],
  ["circle", "Circle"],
] as const;
const CROPS = [
  ["free", "Original"],
  ["square", "1:1"],
  ["wide", "4:3"],
  ["tall", "4:5"],
] as const;

function useSet<L extends Layer>(path: (string | number)[]) {
  const update = useEditor((s) => s.update);
  return (patch: Partial<L>) => update(path, patch);
}

function TextFields({ layer: l, path }: EditorProps<TextLayer>) {
  const set = useSet<TextLayer>(path);
  const theme = useEditor((s) => s.brand.accent);
  return (
    <>
      <TextField label="Text" area value={l.text} onChange={(text) => set({ text })} tip={HIGHLIGHT_TIP} />
      <FontPicker label="Font" value={l.font} onChange={(font) => set({ font })} />
      <TypeControls font={l.font} weight={l.weight} tracking={l.tracking} leading={l.leading} onChange={set} />
      <Slider label="Size" value={l.size} min={10} max={320} step={2} format={(v) => `${Math.round(v)}`} onChange={(size) => set({ size })} />
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
        <ColorField label="Color" value={l.color} onChange={(color) => set({ color })} />
        <div className="flex flex-col gap-1">
          <ColorField label="Highlight color" value={l.accent ?? theme} onChange={(accent) => set({ accent })} />
          {l.accent !== null && (
            <button type="button" className="self-start text-xs font-semibold text-accent underline-offset-2 hover:underline" onClick={() => set({ accent: null })}>
              Use theme color
            </button>
          )}
        </div>
      </div>
      <Segmented<TextLayer["effect"]>
        label="Effect"
        value={l.effect}
        options={EFFECTS}
        // A glow in black would look like a shadow, so it starts in the theme color.
        onChange={(effect) => set({ effect, ...(effect === "glow" && l.effectColor === "#000000" ? { effectColor: theme } : {}) })}
      />
      {l.effect !== "none" && <ColorField label={EFFECT_COLOR[l.effect]} value={l.effectColor} onChange={(effectColor) => set({ effectColor })} />}
      {l.effect === "outline" && (
        <Slider label="Outline thickness" value={l.stroke ?? 0.13} min={0.03} max={0.3} step={0.01} format={(v) => `${Math.round(v * 100)}`} onChange={(stroke) => set({ stroke })} />
      )}
      <Segmented<TextLayer["align"]> label="Align" value={l.align} options={ALIGNS} onChange={(align) => set({ align })} />
      <Slider label="Text box width" value={l.width} min={0.2} max={1} step={0.01} format={(v) => `${Math.round(v * 100)}%`} onChange={(width) => set({ width })} />
      <Toggle label="ALL CAPS" checked={l.caps} onChange={(caps) => set({ caps })} />
    </>
  );
}

function StickerFields({ layer: l, path }: EditorProps<TextLayer>) {
  const set = useSet<TextLayer>(path);
  return (
    <>
      <div className="grid grid-cols-8 gap-1 rounded-lg border border-line bg-raise p-1.5" role="group" aria-label="Swap sticker">
        {STICKERS.map((e) => (
          <button
            key={e}
            type="button"
            aria-label={`Use ${e}`}
            aria-pressed={l.text.trim() === e}
            className="grid aspect-square cursor-pointer place-items-center rounded-md text-[22px] hover:bg-line aria-pressed:bg-line aria-pressed:ring-1 aria-pressed:ring-accent"
            onClick={() => set({ text: e })}
          >
            {e}
          </button>
        ))}
      </div>
      <Slider label="Size" value={l.size} min={30} max={420} step={2} format={(v) => `${Math.round(v)}`} onChange={(size) => set({ size })} />
    </>
  );
}

function ImageFields({ layer: l, path }: EditorProps<ImageLayer>) {
  const set = useSet<ImageLayer>(path);
  const update = useEditor((s) => s.update);
  const cropped = l.crop !== "free" || l.shape === "circle";
  return (
    <>
      <ImageSlot label="Photo" path={[...path, "img"]} contain={!cropped} />
      <Slider label="Size" value={l.w} min={0.05} max={1.2} step={0.01} format={(v) => `${Math.round(v * 100)}%`} onChange={(w) => set({ w })} />
      <Segmented<ImageLayer["shape"]> label="Shape" value={l.shape} options={SHAPES} onChange={(shape) => set({ shape })} />
      {l.shape !== "circle" && <Segmented<ImageLayer["crop"]> label="Crop" value={l.crop} options={CROPS} onChange={(crop) => set({ crop })} />}
      {cropped && (
        <>
          <Slider label="Photo position (left – right)" value={l.img.ox} min={-1} max={1} step={0.01} format={(v) => `${Math.round(v * 50 + 50)}%`} onChange={(ox) => update([...path, "img"], { ox })} />
          <Slider label="Photo position (top – bottom)" value={l.img.oy} min={-1} max={1} step={0.01} format={(v) => `${Math.round(v * 50 + 50)}%`} onChange={(oy) => update([...path, "img"], { oy })} />
        </>
      )}
      <Toggle label="White border" checked={l.border} onChange={(border) => set({ border })} />
    </>
  );
}

/** Opacity, rotation, centering, order, duplicate and delete: the same for every layer. */
function CommonFields({ layer: l, path, index, count }: EditorProps<Layer> & { index: number; count: number }) {
  const set = useSet<Layer>(path);
  const restack = useEditor((s) => s.restackLayer);
  const duplicate = useEditor((s) => s.duplicateLayer);
  const remove = useEditor((s) => s.removeLayer);
  const setLayerSel = useEditor((s) => s.setLayerSel);
  return (
    <>
      <Slider label="Opacity" value={l.opacity ?? 1} min={0.05} max={1} step={0.05} format={(v) => `${Math.round(v * 100)}%`} onChange={(opacity) => set({ opacity })} />
      <Slider label="Rotate" value={l.rotate ?? 0} min={-180} max={180} step={1} format={(v) => `${Math.round(v)}°`} onChange={(r) => set({ rotate: Math.abs(r) < 2 ? 0 : r })} />
      <div className="flex flex-wrap gap-1.5">
        <button type="button" className="btn btn-small" onClick={() => set({ x: 0.5 })}>
          Center left–right
        </button>
        <button type="button" className="btn btn-small" onClick={() => set({ y: 0.5 })}>
          Center top–bottom
        </button>
        <button type="button" className="btn btn-small" disabled={index === count - 1} onClick={() => restack(l.id, 1)}>
          Bring forward
        </button>
        <button type="button" className="btn btn-small" disabled={index === 0} onClick={() => restack(l.id, -1)}>
          Send back
        </button>
        <button type="button" className="btn btn-small" onClick={() => duplicate(l.id)}>
          Duplicate
        </button>
        <button
          type="button"
          className="btn btn-small btn-danger"
          onClick={() => {
            remove(l.id);
            toastUndo(`${l.kind === "image" ? "Photo" : isEmoji(l.text) ? "Sticker" : "Text"} deleted.`);
          }}
        >
          Delete
        </button>
        <button type="button" className="btn btn-small btn-ghost ml-auto" onClick={() => setLayerSel(null)}>
          Done
        </button>
      </div>
    </>
  );
}
