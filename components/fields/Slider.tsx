interface Props {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}

/** Labeled range input with the current value shown on the right. */
export default function Slider({ label, value, min, max, step, format, onChange }: Props) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-baseline justify-between text-xs font-semibold">
        {label}
        <span className="font-normal text-muted tabular-nums">{format(value)}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="h-8 w-full accent-accent" />
    </label>
  );
}
