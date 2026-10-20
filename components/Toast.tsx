import { useEffect, useState } from "react";
import { useEditor } from "@/lib/store";

export default function Toast() {
  const toast = useEditor((s) => s.toast);
  const [hidden, setHidden] = useState<number | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setHidden(toast.at), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  if (!toast || hidden === toast.at) return null;
  return (
    <div
      role="status"
      className="fixed bottom-[calc(20px+env(safe-area-inset-bottom,0px))] left-1/2 z-20 max-w-[calc(100%-32px)] -translate-x-1/2 rounded-full bg-fg px-4 py-2.5 text-[13px] font-semibold text-bg shadow-[0_8px_30px_rgba(0,0,0,.5)]"
    >
      {toast.msg}
    </div>
  );
}
