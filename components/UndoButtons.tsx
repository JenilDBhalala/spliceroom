import { redo, undo, useHistory } from "@/lib/history";

const icon = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

/** Undo / redo arrows. `compact` drops redo until there's something to redo (phone top bar). */
export default function UndoButtons({ compact = false }: { compact?: boolean }) {
  const { canUndo, canRedo } = useHistory();
  const cls = "btn btn-ghost min-h-11 min-w-11 justify-center px-2.5 disabled:opacity-35";
  return (
    <div className="flex gap-1">
      <button type="button" className={cls} disabled={!canUndo} onClick={undo} aria-label="Undo" title="Undo (Ctrl+Z)">
        <svg aria-hidden {...icon}>
          <path d="M9 14L4 9l5-5" />
          <path d="M4 9h10.5a5.5 5.5 0 010 11H11" />
        </svg>
      </button>
      {(!compact || canRedo) && (
        <button type="button" className={cls} disabled={!canRedo} onClick={redo} aria-label="Redo" title="Redo (Ctrl+Shift+Z)">
          <svg aria-hidden {...icon}>
            <path d="M15 14l5-5-5-5" />
            <path d="M20 9H9.5a5.5 5.5 0 000 11H13" />
          </svg>
        </button>
      )}
    </div>
  );
}
