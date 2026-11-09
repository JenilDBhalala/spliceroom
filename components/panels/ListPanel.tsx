import type { ListItem, ListPost, Slide } from "@/types/post";
import { useEditor, useField } from "@/lib/store";
import ColorField from "@/components/fields/ColorField";
import FontPicker from "@/components/fields/FontPicker";
import ImageSlot from "@/components/fields/ImageSlot";
import Segmented from "@/components/fields/Segmented";
import SelectField from "@/components/fields/SelectField";
import TextField from "@/components/fields/TextField";
import Toggle from "@/components/fields/Toggle";
import { Group, HIGHLIGHT_TIP, OrderButtons, Row } from "./ui";

const P = ["posts", "list"] as const;
const PANEL_COUNTS = [[2, "2 photos"], [3, "3 photos"], [4, "4 photos"]] as const;
const RATING_KINDS = [
  ["imdb", "IMDb"],
  ["tomato", "🍅 %"],
  ["stars", "Stars"],
  ["text", "Text"],
] as const;
const RATING_LABEL = { imdb: "IMDb rating", tomato: "Tomato score (%)", stars: "Stars (out of 5, or 10)", text: "Rating text" } as const;

export default function ListPanel({ slide }: { slide: Slide }) {
  return slide.kind === "listItem" ? <MovieCard i={slide.i!} /> : <Cover />;
}

function Cover() {
  const panelCount = useEditor((s) => s.posts.list.panelCount);
  const setPanelCount = useEditor((s) => s.setPanelCount);
  const [text, setText] = useField<string>(P, "text");
  const [swipe, setSwipe] = useField<boolean>(P, "swipe");
  const [follow, setFollow] = useField<boolean>(P, "follow");
  return (
    <>
      <SelectField label="Photos across the top" value={panelCount} options={PANEL_COUNTS} onChange={setPanelCount} />
      {Array.from({ length: panelCount }, (_, i) => (
        <ImageSlot key={i} label={`Photo ${i + 1}`} path={[...P, "panels", i]} />
      ))}
      <TextField label="Headline" area value={text} onChange={setText} tip={HIGHLIGHT_TIP} />
      <Group title="Post">
        <Toggle label={'"Swipe" tag'} checked={swipe} onChange={setSwipe} />
        <Toggle label="End with your follow card" checked={follow} onChange={setFollow} />
      </Group>
    </>
  );
}

function MovieCard({ i }: { i: number }) {
  const it = useEditor((s) => s.posts.list.items[i]) as ListItem | undefined;
  const count = useEditor((s) => s.posts.list.items.length);
  const ratingKind = useEditor((s) => s.posts.list.ratingKind ?? "imdb");
  const update = useEditor((s) => s.update);
  const moveItem = useEditor((s) => s.moveItem);
  const deleteItem = useEditor((s) => s.deleteItem);
  if (!it) return null;
  const path = [...P, "items", i];
  const set = (patch: Partial<ListItem>) => update(path, patch);
  return (
    <>
      <ImageSlot key={`${it.id}-img`} label="Photo" path={[...path, "img"]} />
      <ImageSlot
        key={`${it.id}-logo`}
        label="Title logo"
        path={[...path, "logo"]}
        contain
        empty="Optional. A transparent PNG of the title. Without one, the title text is used."
      />
      <TextField label="Title text" value={it.title} onChange={(title) => set({ title })} tip="Shown when there is no title logo." />
      <TextField label="Line under the title" value={it.meta ?? ""} onChange={(meta) => set({ meta })} tip="e.g. 2024 · Drama. Empty hides it." />
      <FontPicker label="Title font" value={it.font} onChange={(font) => set({ font })} />
      <ColorField label="Title color" value={it.color} onChange={(color) => set({ color })} />
      <Group title="Rating">
        <Segmented<NonNullable<ListPost["ratingKind"]>>
          label="Rating style (every movie)"
          value={ratingKind}
          options={RATING_KINDS}
          onChange={(k) => update(P, { ratingKind: k })}
        />
        <Row>
          <TextField label={RATING_LABEL[ratingKind]} value={it.rating} onChange={(rating) => set({ rating })} />
        </Row>
        <Toggle label="Show rating" checked={it.showRating} onChange={(showRating) => set({ showRating })} />
      </Group>
      <Group title="Order">
        <OrderButtons index={i} count={count} what="movie" onMove={(d) => moveItem("list", i, d)} onDelete={() => deleteItem("list", i)} />
      </Group>
    </>
  );
}
