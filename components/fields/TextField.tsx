import { useId } from "react";

interface Props {
  label: string;
  value: string;
  onChange: (v: string) => void;
  area?: boolean;
  tip?: string;
}

export default function TextField({ label, value, onChange, area, tip }: Props) {
  const id = useId();
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-semibold">
        {label}
      </label>
      {area ? (
        <textarea id={id} rows={4} className="input min-h-[90px] resize-y leading-[1.4]" value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input id={id} type="text" className="input" value={value} onChange={(e) => onChange(e.target.value)} />
      )}
      {tip && <span className="text-xs text-muted">{tip}</span>}
    </div>
  );
}
