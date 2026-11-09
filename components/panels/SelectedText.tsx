import type { SlideKind, TextBlock, TextEffect, TextLook, TextLooks, TextMove, TextMoves } from "@/types/post";
import { toastUndo } from "@/lib/history";
import { POST_OF } from "@/lib/render";
import { useEditor } from "@/lib/store";
import ColorField from "@/components/fields/ColorField";
import FontPicker from "@/components/fields/FontPicker";
import Segmented from "@/components/fields/Segmented";
import Slider from "@/components/fields/Slider";
import Toggle from "@/components/fields/Toggle";
import { Group, Note } from "./ui";

/** Friendly names for text block keys (digits mark a row: "title2" is row 3's title). */
const NAMES: Record<string, string> = {
  top: "Top text",
  bottom: "Bottom text",
  caption: "Caption",
  watermark: "Page name",
  brand: "Page name",
  swipe: "Swipe tag",
  text: "Main text",
  title: "Title",
  kicker: "Line above the title",
  number: "Lesson number",
  body: "Lesson text",
  page: "Page name",
  progress: "Slide count",
  tagline: "Tagline",
  date: "Release line",
  credits: "Credits",
  mark: "Quote mark",
  quote: "Quote",
  author: "Who said it",
  source: "Where it's from",
  headline: "Headline",
  leftLabel: "Left label",
  rightLabel: "Right label",
  vs: "VS badge",
  rating: "Rating",
  card: "Card",
  cta: "Follow headline",
  year: "Year",
};

function nameOf(key: string) {
  const [, part] = key.split(".");
  const m = /^([a-zA-Z]+)(\d+)$/.exec(part);
  if (m) return `${NAMES[m[1]] ?? m[1]} (row ${+m[2] + 1})`;
  return NAMES[part] ?? part;
}

const EFFECTS = [
  ["none", "None"],
  ["outline", "Outline"],
  ["shadow", "Shadow"],
  ["glow", "Glow"],
  ["box", "Box"],
] as const;
const EFFECT_COLOR: Record<TextEffect, string> = { none: "", outline: "Outline color", shadow: "Shadow color", glow: "Glow color", box: "Box color" };

/** Outline, shadow, glow or a box behind the text, like a design app's text effects. */
function EffectFields({ look, base, onChange }: { look: TextLook; base: TextBlock["base"]; onChange: (patch: TextLook) => void }) {
  const theme = useEditor((s) => s.brand.accent);
  const effect = look.effect ?? base.effect ?? "none";
  const color = look.effectColor ?? base.effectColor ?? "#000000";
  return (
    <>
      <Segmented<TextEffect>
        label="Effect"
        value={effect}
        options={EFFECTS}
        // A glow in black would look like a shadow, so it starts in the theme color.
        onChange={(e) => onChange({ effect: e, ...(e === "glow" && !look.effectColor ? { effectColor: theme } : {}) })}
      />
      {effect !== "none" && <ColorField label={EFFECT_COLOR[effect]} value={toHex(color)} onChange={(effectColor) => onChange({ effectColor })} />}
      {effect === "outline" && (
        <Slider
          label="Outline thickness"
          value={look.stroke ?? base.stroke ?? 0.13}
          min={0.03}
          max={0.3}
          step={0.01}
          format={(v) => `${Math.round(v * 100)}`}
          onChange={(stroke) => onChange({ stroke })}
        />
      )}
    </>
  );
}

const without = <T,>(o: Record<string, T> | undefined, key: string) => Object.fromEntries(Object.entries(o ?? {}).filter(([k]) => k !== key));

/** Color inputs need #rrggbb; template colors may be rgba() or short hex. */
function toHex(c: string) {
  const rgb = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(c);
  if (rgb) return `#${rgb.slice(1, 4).map((n) => (+n).toString(16).padStart(2, "0")).join("")}`;
  if (/^#[0-9a-f]{3}$/i.test(c)) return `#${[...c.slice(1)].map((h) => h + h).join("")}`;
  return c;
}

/** The text block tapped on the preview: its own color, font, opacity, size, angle and position. */
export default function SelectedText({ block }: { block: TextBlock }) {
  const post = POST_OF[block.key.split(".")[0] as Exclude<SlideKind, "custom">];
  const looks = useEditor((s) => s.posts[post].looks);
  const moves = useEditor((s) => s.posts[post].moves);
  const theme = useEditor((s) => s.brand.accent);
  const update = useEditor((s) => s.update);
  const setTextSel = useEditor((s) => s.setTextSel);
  const look: TextLook = looks?.[block.key] ?? {};
  const move: TextMove = moves?.[block.key] ?? { dx: 0, dy: 0, s: 1 };
  const setLook = (patch: TextLook) => update(["posts", post, "looks"], { [block.key]: { ...look, ...patch } } satisfies TextLooks);
  const setMove = (patch: Partial<TextMove>) => update(["posts", post, "moves"], { [block.key]: { ...move, ...patch } } satisfies TextMoves);
  const changed = Object.keys(look).length > 0 || move.dx !== 0 || move.dy !== 0 || move.s !== 1 || !!move.r;
  const { base, home } = block;

  return (
    <Group title={`Selected: ${nameOf(block.key)}`}>
      {block.look === "style" && (
        <>
          <FontPicker label="Font" value={look.font ?? base.font!} onChange={(font) => setLook({ font })} />
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
            <ColorField label="Color" value={toHex(look.color ?? base.color)} onChange={(color) => setLook({ color })} />
            <ColorField label="Highlight color" value={toHex(look.accent ?? base.accent ?? theme)} onChange={(accent) => setLook({ accent })} />
          </div>
          <Toggle label="ALL CAPS" checked={look.caps ?? !!base.caps} onChange={(caps) => setLook({ caps })} />
        </>
      )}
      {block.look === "color" && <ColorField label="Color" value={toHex(look.color ?? base.color)} onChange={(color) => setLook({ color })} />}
      {block.look !== "none" && <EffectFields look={look} base={base} onChange={setLook} />}
      {block.look === "none" && <Note>This part keeps the template&apos;s colors. You can still move, resize, turn and fade it.</Note>}
      <Slider label="Size" value={move.s} min={0.3} max={3} step={0.05} format={(v) => `${Math.round(v * 100)}%`} onChange={(s) => setMove({ s })} />
      <Slider label="Opacity" value={look.opacity ?? 1} min={0.1} max={1} step={0.05} format={(v) => `${Math.round(v * 100)}%`} onChange={(opacity) => setLook({ opacity })} />
      <Slider label="Rotate" value={move.r ?? 0} min={-90} max={90} step={1} format={(v) => `${Math.round(v)}°`} onChange={(r) => setMove({ r: Math.abs(r) < 2 ? 0 : r })} />
      <div className="flex flex-wrap gap-1.5">
        <button type="button" className="btn btn-small" onClick={() => setMove({ dx: 0.5 - home.cx })}>
          Center left–right
        </button>
        <button type="button" className="btn btn-small" onClick={() => setMove({ dy: 0.5 - home.cy })}>
          Center top–bottom
        </button>
        {changed && (
          <button
            type="button"
            className="btn btn-small"
            onClick={() => {
              update(["posts", post], { looks: without(looks, block.key), moves: without(moves, block.key) });
              toastUndo(`${nameOf(block.key)} is back to the template's look.`);
            }}
          >
            Reset this text
          </button>
        )}
        <button type="button" className="btn btn-small btn-ghost ml-auto" onClick={() => setTextSel(null)}>
          Done
        </button>
      </div>
    </Group>
  );
}
