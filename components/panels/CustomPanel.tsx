import { useEffect, useRef } from "react";
import type { CustomPost, ImageLayer, Layer, TextLayer } from "@/types/post";
import { toastUndo } from "@/lib/history";
import { CANVAS_PRESETS, useEditor } from "@/lib/store";
import ColorField from "@/components/fields/ColorField";
import FontPicker from "@/components/fields/FontPicker";
import ImageSlot from "@/components/fields/ImageSlot";
import Segmented from "@/components/fields/Segmented";
import Slider from "@/components/fields/Slider";
import TextField from "@/components/fields/TextField";
import Toggle from "@/components/fields/Toggle";
import TypeControls from "@/components/fields/TypeControls";
import { Group, HIGHLIGHT_TIP, Note } from "./ui";

const P = ["posts", "custom"] as const;

/** Blank canvas: starting layouts, the layer list, and the selected layer's (or the background's) settings. */
export default function CustomPanel() {
  const layers = useEditor((s) => s.posts.custom.layers);
  const sel = useEditor((s) => s.layerSel);
  const setLayerSel = useEditor((s) => s.setLayerSel);
  const addLayer = useEditor((s) => s.addLayer);
  const applyPreset = useEditor((s) => s.applyPreset);
  const index = layers.findIndex((l) => l.id === sel);
  const layer = index >= 0 ? layers[index] : null;

  return (
    <>
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold">Start from a layout</span>
        <div className="flex flex-wrap gap-1.5">
          {CANVAS_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              className="btn btn-small min-h-9"
              onClick={() => {
                applyPreset(p.id);
                toastUndo(`Switched to the ${p.name} layout.`);
              }}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <Group title="Layers">
        <Note>Tap a layer here or on the preview. Drag it to move; pinch or scroll to resize.</Note>
        <ol className="m-0 flex list-none flex-col gap-1 p-0">
          {/* Top of the list is the front of the canvas. */}
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
                <span className="min-w-0 flex-1 truncate text-sm">{l.kind === "text" ? l.text.replace(/\*/g, "") || "Empty text" : "Photo"}</span>
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              aria-pressed={sel === null}
              onClick={() => setLayerSel(null)}
              className="flex min-h-11 w-full cursor-pointer items-center gap-2.5 rounded-lg border border-dashed border-line px-3 text-left text-sm text-muted hover:border-muted aria-pressed:border-accent aria-pressed:text-fg"
            >
              <span aria-hidden className="grid size-6 flex-none place-items-center rounded bg-line text-xs">▤</span>
              Background
            </button>
          </li>
        </ol>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="btn justify-center" onClick={() => addLayer("text")}>
            + Text
          </button>
          <button type="button" className="btn justify-center" onClick={() => addLayer("image")}>
            + Photo
          </button>
        </div>
      </Group>

      {layer ? <LayerEditor key={layer.id} layer={layer} index={index} count={layers.length} /> : <BackgroundEditor />}
    </>
  );
}

function LayerActions({ layer, index, count }: { layer: Layer; index: number; count: number }) {
  const restack = useEditor((s) => s.restackLayer);
  const duplicate = useEditor((s) => s.duplicateLayer);
  const remove = useEditor((s) => s.removeLayer);
  const update = useEditor((s) => s.update);
  const path = [...P, "layers", index];
  return (
    <div className="flex flex-wrap gap-1.5">
      <button type="button" className="btn btn-small" disabled={index === count - 1} onClick={() => restack(layer.id, 1)}>
        Bring forward
      </button>
      <button type="button" className="btn btn-small" disabled={index === 0} onClick={() => restack(layer.id, -1)}>
        Send back
      </button>
      <button type="button" className="btn btn-small" onClick={() => update(path, { x: 0.5 })}>
        Center
      </button>
      <button type="button" className="btn btn-small" onClick={() => duplicate(layer.id)}>
        Duplicate
      </button>
      <button
        type="button"
        className="btn btn-small btn-danger"
        onClick={() => {
          remove(layer.id);
          toastUndo(layer.kind === "text" ? "Text deleted." : "Photo deleted.");
        }}
      >
        Delete
      </button>
    </div>
  );
}

const ALIGNS = [
  ["left", "Left"],
  ["center", "Center"],
  ["right", "Right"],
] as const;
const EFFECTS = [
  ["none", "None"],
  ["outline", "Outline"],
  ["shadow", "Shadow"],
  ["box", "Box"],
] as const;
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

function LayerEditor({ layer, index, count }: { layer: Layer; index: number; count: number }) {
  const ref = useRef<HTMLDivElement>(null);
  // Bring the settings into view when a layer is picked (on phones it's below the layer list).
  useEffect(() => {
    ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, []);
  return (
    <div ref={ref} className="flex flex-col">
      <Group title={layer.kind === "text" ? "Selected text" : "Selected photo"}>
        <LayerActions layer={layer} index={index} count={count} />
        {layer.kind === "text" ? <TextLayerFields layer={layer} index={index} /> : <ImageLayerFields layer={layer} index={index} />}
      </Group>
    </div>
  );
}

function TextLayerFields({ layer: l, index }: { layer: TextLayer; index: number }) {
  const update = useEditor((s) => s.update);
  const theme = useEditor((s) => s.brand.accent);
  const set = (patch: Partial<TextLayer>) => update([...P, "layers", index], patch);
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
      <Segmented<TextLayer["effect"]> label="Effect" value={l.effect} options={EFFECTS} onChange={(effect) => set({ effect })} />
      {l.effect !== "none" && <ColorField label={l.effect === "box" ? "Box color" : `${l.effect === "outline" ? "Outline" : "Shadow"} color`} value={l.effectColor} onChange={(effectColor) => set({ effectColor })} />}
      <Segmented<TextLayer["align"]> label="Align" value={l.align} options={ALIGNS} onChange={(align) => set({ align })} />
      <Slider label="Text box width" value={l.width} min={0.2} max={1} step={0.01} format={(v) => `${Math.round(v * 100)}%`} onChange={(width) => set({ width })} />
      <Toggle label="ALL CAPS" checked={l.caps} onChange={(caps) => set({ caps })} />
    </>
  );
}

function ImageLayerFields({ layer: l, index }: { layer: ImageLayer; index: number }) {
  const update = useEditor((s) => s.update);
  const path = [...P, "layers", index];
  const set = (patch: Partial<ImageLayer>) => update(path, patch);
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

const BGS = [
  ["photo", "Photo"],
  ["color", "Color"],
  ["gradient", "Gradient"],
] as const;

function BackgroundEditor() {
  const p = useEditor((s) => s.posts.custom);
  const update = useEditor((s) => s.update);
  const set = (patch: Partial<CustomPost>) => update(P, patch);
  return (
    <Group title="Background">
      <Segmented<CustomPost["bg"]> label="Background" value={p.bg} options={BGS} onChange={(bg) => set({ bg })} />
      {p.bg === "photo" && (
        <>
          <ImageSlot label="Background photo" path={[...P, "bgImg"]} />
          <Slider label="Darken" value={p.darken} min={0} max={0.8} step={0.05} format={(v) => `${Math.round(v * 100)}%`} onChange={(darken) => set({ darken })} />
        </>
      )}
      {p.bg === "color" && <ColorField label="Color" value={p.bgColor} onChange={(bgColor) => set({ bgColor })} />}
      {p.bg === "gradient" && (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
          <ColorField label="Top color" value={p.gradient[0]} onChange={(c) => set({ gradient: [c, p.gradient[1]] })} />
          <ColorField label="Bottom color" value={p.gradient[1]} onChange={(c) => set({ gradient: [p.gradient[0], c] })} />
        </div>
      )}
    </Group>
  );
}
