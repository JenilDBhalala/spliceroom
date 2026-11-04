import { create } from "zustand";
import { useEditor, type EditorState } from "./store";

/** What undo brings back: the content, plus where you were looking. */
type Snapshot = Pick<EditorState, "brand" | "posts" | "size" | "fmt" | "sel" | "layerSel">;

const LIMIT = 100;
/** Changes closer together than this (typing, dragging) undo as one step. */
const BURST_MS = 600;

const past: Snapshot[] = [];
const future: Snapshot[] = [];
let lastChange = 0;
let restoring = false;

/** Whether the undo and redo buttons are enabled. */
export const useHistory = create(() => ({ canUndo: false, canRedo: false }));
const sync = () => useHistory.setState({ canUndo: past.length > 0, canRedo: future.length > 0 });

const snap = (s: EditorState): Snapshot => ({ brand: s.brand, posts: s.posts, size: s.size, fmt: s.fmt, sel: s.sel, layerSel: s.layerSel });

function restore(to: Snapshot, from: Snapshot[]) {
  from.push(snap(useEditor.getState()));
  restoring = true;
  useEditor.setState({ ...to, mode: "slide", activeSlot: null });
  restoring = false;
  lastChange = 0;
  sync();
}

export function undo() {
  const s = past.pop();
  if (s) restore(s, future);
}

export function redo() {
  const s = future.pop();
  if (s) restore(s, past);
}

if (typeof window !== "undefined") {
  useEditor.subscribe((s, prev) => {
    if (restoring || (s.posts === prev.posts && s.brand === prev.brand && s.size === prev.size && s.fmt === prev.fmt)) return;
    const now = Date.now();
    if (now - lastChange > BURST_MS) {
      past.push(snap(prev));
      if (past.length > LIMIT) past.shift();
      future.length = 0;
      sync();
    }
    lastChange = now;
  });
  // Restoring the saved draft isn't something to undo.
  useEditor.persist.onFinishHydration(() => {
    past.length = future.length = 0;
    sync();
  });
}

/** Tell the user what just happened, with a button to take it back. */
export const toastUndo = (msg: string) => useEditor.getState().showToast(msg, { label: "Undo", run: undo });

/** Ctrl/⌘+Z and Ctrl/⌘+Shift+Z (or Ctrl+Y), except inside text boxes, which have their own undo. */
export function onUndoKey(e: KeyboardEvent) {
  const t = e.target as HTMLElement | null;
  if (!(e.metaKey || e.ctrlKey) || e.altKey || t?.closest("input, textarea, select, [contenteditable]")) return;
  const k = e.key.toLowerCase();
  if (k === "z" || k === "y") {
    e.preventDefault();
    if (k === "y" || e.shiftKey) redo();
    else undo();
  }
}
