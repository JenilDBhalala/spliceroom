import type { FontKey } from "@/types/post";
import { cssFamily } from "@/app/fonts";
import { WEIGHT_NAMES, fontDef, weightOf } from "@/lib/render/fonts";
import Slider from "./Slider";

export interface TypeSettings {
  weight: number | null;
  tracking: number;
  leading: number;
}

interface Props extends Partial<TypeSettings> {
  font: FontKey;
  onChange: (patch: Partial<TypeSettings>) => void;
}

/** Weight (only for fonts that have more than one), letter spacing and line spacing. */
export default function TypeControls({ font, weight = null, tracking = 0, leading = 1, onChange }: Props) {
  const def = fontDef(font);
  const current = weightOf(def, weight);
  const changed = weight !== null || tracking !== 0 || leading !== 1;
  return (
    <>
      {def.weights.length > 1 ? (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold">Weight</span>
          <div role="radiogroup" aria-label="Weight" className="flex flex-wrap gap-1.5">
            {def.weights.map((w) => (
              <button
                key={w}
                type="button"
                role="radio"
                aria-checked={w === current}
                onClick={() => onChange({ weight: w === def.weight ? null : w })}
                className="min-h-9 cursor-pointer rounded-md border border-line bg-raise px-2.5 text-[13px] hover:border-muted aria-checked:border-accent aria-checked:ring-1 aria-checked:ring-accent"
                style={{ fontFamily: cssFamily(def.id), fontWeight: w }}
              >
                {WEIGHT_NAMES[w] ?? w}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="m-0 text-xs text-muted">{def.label} comes in one weight. Pick Montserrat, Poppins or Archivo for lighter text.</p>
      )}
      <Slider
        label="Letter spacing"
        value={tracking}
        min={-0.05}
        max={0.3}
        step={0.01}
        format={(v) => (Math.abs(v) < 0.005 ? "Normal" : `${v > 0 ? "+" : ""}${Math.round(v * 100)}%`)}
        onChange={(v) => onChange({ tracking: Math.abs(v) < 0.005 ? 0 : v })}
      />
      <Slider
        label="Line spacing"
        value={leading}
        min={0.7}
        max={1.8}
        step={0.05}
        format={(v) => (Math.abs(v - 1) < 0.01 ? "Normal" : `${v.toFixed(2)}×`)}
        onChange={(v) => onChange({ leading: Math.abs(v - 1) < 0.01 ? 1 : v })}
      />
      {changed && (
        <button
          type="button"
          className="self-start text-xs font-semibold text-accent underline-offset-2 hover:underline"
          onClick={() => onChange({ weight: null, tracking: 0, leading: 1 })}
        >
          Reset weight and spacing
        </button>
      )}
    </>
  );
}
