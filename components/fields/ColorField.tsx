import { useId, useState } from "react";

interface Props {
  label: string;
  value: string;
  onChange: (v: string) => void;
}

/** Color picker plus a hex box; the hex box only commits complete #rrggbb values. */
export default function ColorField({ label, value, onChange }: Props) {
  const id = useId();
  const [text, setText] = useState(value);
  const [prev, setPrev] = useState(value);
  if (value !== prev) {
    setPrev(value);
    setText(value);
  }
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-semibold">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-[38px] w-[42px] flex-none cursor-pointer rounded-lg border border-line bg-raise p-[3px]"
        />
        <input
          id={id}
          type="text"
          className="input flex-1"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            const v = e.target.value.trim();
            if (/^#[0-9a-f]{6}$/i.test(v)) onChange(v);
          }}
        />
      </div>
    </div>
  );
}
