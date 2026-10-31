import { useEditor } from "@/lib/store";
import { SIZE_OPTIONS } from "@/lib/templates";

/** 4:5 / 1:1 / 9:16 switch. The icon's shape mirrors the ratio. */
export default function SizePicker() {
  const size = useEditor((s) => s.size);
  const setSize = useEditor((s) => s.setSize);
  return (
    <div role="radiogroup" aria-label="Post size" className="flex flex-none gap-1 rounded-lg border border-line bg-raise p-1">
      {SIZE_OPTIONS.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={o.id === size}
          title={o.hint}
          onClick={() => setSize(o.id)}
          className="flex min-h-9 cursor-pointer items-center gap-1.5 rounded-md px-2.5 text-[13px] font-semibold text-muted tabular-nums hover:text-fg aria-checked:bg-accent aria-checked:text-on-accent"
        >
          <i
            aria-hidden
            className="inline-block rounded-[2px] border-[1.5px] border-current"
            style={o.id === "portrait" ? { width: 10, height: 12.5 } : o.id === "square" ? { width: 11, height: 11 } : { width: 8, height: 14 }}
          />
          {o.label}
        </button>
      ))}
    </div>
  );
}
