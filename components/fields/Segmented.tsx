import { useId } from "react";

interface Props<T extends string> {
  label: string;
  value: T;
  options: readonly (readonly [T, string])[];
  onChange: (v: T) => void;
}

/** A row of buttons for 2–3 mutually exclusive choices. */
export default function Segmented<T extends string>({ label, value, options, onChange }: Props<T>) {
  const id = useId();
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span id={id} className="text-xs font-semibold">
        {label}
      </span>
      <div role="radiogroup" aria-labelledby={id} className="flex gap-1 rounded-lg border border-line bg-raise p-1">
        {options.map(([v, name]) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={v === value}
            onClick={() => onChange(v)}
            className="min-h-9 flex-1 cursor-pointer rounded-md px-2 text-[13px] font-semibold text-muted hover:text-fg aria-checked:bg-accent aria-checked:text-on-accent"
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}
