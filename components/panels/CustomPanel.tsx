import type { CustomPost } from "@/types/post";
import { toastUndo } from "@/lib/history";
import { CANVAS_PRESETS, useEditor } from "@/lib/store";
import ColorField from "@/components/fields/ColorField";
import ImageSlot from "@/components/fields/ImageSlot";
import Segmented from "@/components/fields/Segmented";
import Slider from "@/components/fields/Slider";
import { AddButtons, LayerEditor, LayerList } from "./Layers";
import { Group, Note } from "./ui";

const P = ["posts", "custom"] as const;

/** Blank canvas: starting layouts, the layer list, and the selected layer's (or the background's) settings. */
export default function CustomPanel() {
  const layers = useEditor((s) => s.posts.custom.layers);
  const sel = useEditor((s) => s.layerSel);
  const setLayerSel = useEditor((s) => s.setLayerSel);
  const applyPreset = useEditor((s) => s.applyPreset);
  const layer = layers.find((l) => l.id === sel);

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
        <LayerList>
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
        </LayerList>
        <AddButtons />
      </Group>

      {layer ? <LayerEditor /> : <BackgroundEditor />}
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
