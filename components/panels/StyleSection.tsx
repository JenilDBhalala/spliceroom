import type { StyledKey, TextStyle } from "@/types/post";
import { useEditor } from "@/lib/store";
import ColorField from "@/components/fields/ColorField";
import FontPicker from "@/components/fields/FontPicker";
import Toggle from "@/components/fields/Toggle";
import { Note } from "./ui";

/** Font, colors, size and caps for a template's main text. Collapsed by default to keep the panel short. */
export default function StyleSection({ postKey, note }: { postKey: StyledKey; note?: string }) {
  const st = useEditor((s) => s.posts[postKey].style);
  const theme = useEditor((s) => s.brand.accent);
  const update = useEditor((s) => s.update);
  const resetStyle = useEditor((s) => s.resetStyle);
  const set = (patch: Partial<TextStyle>) => update(["posts", postKey, "style"], patch);

  return (
    <details className="group rounded-xl border border-line bg-raise/40 open:bg-transparent">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-3.5 font-semibold [&::-webkit-details-marker]:hidden">
        <span>
          Text style
          <span className="ml-2 text-xs font-normal text-muted">font, colors, size</span>
        </span>
        <span aria-hidden className="text-muted transition-transform group-open:rotate-180">
          ▾
        </span>
      </summary>
      <div className="flex flex-col gap-3.5 border-t border-line p-3.5">
        {note && <Note>{note}</Note>}
        <FontPicker label="Font" value={st.font} onChange={(font) => set({ font })} />
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
          <ColorField label="Text color" value={st.color} onChange={(color) => set({ color })} />
          <div className="flex flex-col gap-1">
            <ColorField label="Highlight color" value={st.accent ?? theme} onChange={(accent) => set({ accent })} />
            {st.accent !== null && (
              <button type="button" className="self-start text-xs font-semibold text-accent underline-offset-2 hover:underline" onClick={() => set({ accent: null })}>
                Use theme color
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between text-xs font-semibold">
            <label htmlFor={`${postKey}-scale`}>Text size</label>
            <span className="text-muted tabular-nums">{Math.round(st.scale * 100)}%</span>
          </div>
          <input
            id={`${postKey}-scale`}
            type="range"
            min={0.7}
            max={1.3}
            step={0.05}
            value={st.scale}
            onChange={(e) => set({ scale: +e.target.value })}
            className="h-8 w-full accent-accent"
          />
        </div>
        <Toggle label="ALL CAPS" checked={st.caps} onChange={(caps) => set({ caps })} />
        <button type="button" className="btn btn-small btn-ghost self-start" onClick={() => resetStyle(postKey)}>
          Reset style
        </button>
      </div>
    </details>
  );
}
