import { useEffect, useState } from "react";
import { useEditor } from "@/lib/store";

/** Centered at the bottom; `w-max` lets it use the full width before wrapping (left: 50% alone would cap it at half). */
export default function Toast() {
  const toast = useEditor((s) => s.toast);
  const [hidden, setHidden] = useState<number | null>(null);

  useEffect(() => {
    if (!toast) return;
    // Leave time to reach the button.
    const t = setTimeout(() => setHidden(toast.at), toast.action ? 6000 : 3200);
    return () => clearTimeout(t);
  }, [toast]);

  if (!toast || hidden === toast.at) return null;
  return (
    <div
      role="status"
      className="fixed bottom-[calc(76px+env(safe-area-inset-bottom,0px))] left-1/2 md:bottom-[calc(20px+env(safe-area-inset-bottom,0px))] z-20 flex w-max max-w-[calc(100%-32px)] -translate-x-1/2 items-center gap-3 rounded-[22px] bg-fg py-2.5 pr-2.5 pl-4 text-[13px] font-semibold text-bg shadow-[0_8px_30px_rgba(0,0,0,.5)] [&:not(:has(button))]:pr-4"
    >
      <span>{toast.msg}</span>
      {toast.action && (
        <button
          type="button"
          className="-my-1 min-h-8 cursor-pointer rounded-full bg-bg px-3.5 text-[13px] font-bold text-fg"
          onClick={() => {
            toast.action!.run();
            setHidden(toast.at);
          }}
        >
          {toast.action.label}
        </button>
      )}
    </div>
  );
}
