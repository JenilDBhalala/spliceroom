import { useId, useState } from "react";
import type { FontKey } from "@/types/post";
import { cssFamily } from "@/app/fonts";
import { FONT_GROUPS, FONTS, fontDef } from "@/lib/render/fonts";

interface Props {
  label: string;
  value: FontKey;
  onChange: (v: FontKey) => void;
}

/** Shows the chosen font in its own face; opens a grid of live samples grouped by style. */
export default function FontPicker({ label, value, onChange }: Props) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const cur = fontDef(value);
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span id={id} className="text-xs font-semibold">
        {label}
      </span>
      <button
        type="button"
        aria-expanded={open}
        aria-labelledby={id}
        onClick={() => setOpen(!open)}
        className="input flex min-h-11 cursor-pointer items-center justify-between gap-3 text-left"
      >
        <span className="truncate text-lg leading-tight" style={{ fontFamily: cssFamily(cur.id), fontWeight: cur.weight }}>
          {cur.label}
        </span>
        <span className="flex-none text-xs text-muted">{open ? "Close" : "Change"}</span>
      </button>
      {open && (
        <div className="flex flex-col gap-3 rounded-lg border border-line bg-bg/60 p-2.5">
          {FONT_GROUPS.map((g) => (
            <div key={g} className="flex flex-col gap-1.5">
              <span className="text-[10.5px] font-bold tracking-[.12em] text-muted uppercase">{g}</span>
              <div className="grid grid-cols-2 gap-1.5">
                {FONTS.filter((f) => f.group === g).map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    aria-pressed={f.key === value}
                    onClick={() => {
                      onChange(f.key);
                      setOpen(false);
                    }}
                    className="flex min-h-14 cursor-pointer flex-col items-start justify-center gap-0.5 rounded-md border border-line bg-raise px-2.5 py-1.5 text-left hover:border-muted aria-pressed:border-accent aria-pressed:ring-1 aria-pressed:ring-accent"
                  >
                    <span className="w-full truncate text-[19px] leading-tight" style={{ fontFamily: cssFamily(f.id), fontWeight: f.weight }}>
                      {f.label}
                    </span>
                    <span className="text-[11px] text-muted">{f.hint}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
