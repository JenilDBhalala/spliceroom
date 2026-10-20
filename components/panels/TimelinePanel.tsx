import { useEditor } from "@/lib/store";
import ImageSlot from "@/components/fields/ImageSlot";
import TextField from "@/components/fields/TextField";
import { Row } from "./ui";

export default function TimelinePanel() {
  const rows = useEditor((s) => s.posts.timeline.rows);
  const update = useEditor((s) => s.update);
  const addRow = useEditor((s) => s.addTimelineRow);
  const removeRow = useEditor((s) => s.removeTimelineRow);
  return (
    <>
      {rows.map((r, i) => {
        const path = ["posts", "timeline", "rows", i];
        return (
          <fieldset key={r.id} className="m-0 flex min-w-0 flex-col gap-3 rounded-xl border border-line p-3">
            <legend className="px-1.5 text-[11px] font-bold tracking-[.12em] text-muted uppercase">{`Row ${i + 1}`}</legend>
            <ImageSlot label="Photo" path={[...path, "img"]} />
            <ImageSlot
              label="Title logo"
              path={[...path, "logo"]}
              contain
              empty="Optional transparent PNG. Without one, the title text is used."
            />
            <Row>
              <TextField label="Title" value={r.title} onChange={(title) => update(path, { title })} />
              <TextField label="Year" value={r.year} onChange={(year) => update(path, { year })} />
            </Row>
            {rows.length > 2 && (
              <button type="button" className="btn btn-small btn-danger self-start" onClick={() => removeRow(i)}>
                Remove row
              </button>
            )}
          </fieldset>
        );
      })}
      <button type="button" className="btn self-start" disabled={rows.length >= 5} onClick={addRow}>
        + Add row
      </button>
    </>
  );
}
