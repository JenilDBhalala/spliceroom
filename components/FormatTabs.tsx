import type { FormatId } from "@/types/post";
import { useEditor } from "@/lib/store";

const FORMATS: { id: FormatId; name: string }[] = [
  { id: "headline", name: "Headline" },
  { id: "list", name: "List" },
  { id: "news", name: "News story" },
  { id: "lessons", name: "Lessons" },
  { id: "timeline", name: "Timeline" },
  { id: "follow", name: "Follow card" },
];

export default function FormatTabs() {
  const fmt = useEditor((s) => s.fmt);
  const setFmt = useEditor((s) => s.setFmt);
  return (
    <nav role="tablist" aria-label="Post format" className="flex flex-wrap gap-1">
      {FORMATS.map((f) => (
        <button
          key={f.id}
          type="button"
          role="tab"
          aria-selected={f.id === fmt}
          onClick={() => setFmt(f.id)}
          className="cursor-pointer rounded-full border border-transparent bg-transparent px-3.5 py-[7px] font-semibold text-muted hover:border-line hover:text-fg aria-selected:bg-accent aria-selected:text-on-accent"
        >
          {f.name}
        </button>
      ))}
    </nav>
  );
}
