import { useField } from "@/lib/store";
import ImageSlot from "@/components/fields/ImageSlot";
import TextField from "@/components/fields/TextField";
import { Group, HIGHLIGHT_TIP } from "./ui";

const P = ["posts", "poster"] as const;

export default function PosterPanel() {
  const [title, setTitle] = useField<string>(P, "title");
  const [tagline, setTagline] = useField<string>(P, "tagline");
  const [top, setTop] = useField<string>(P, "top");
  const [date, setDate] = useField<string>(P, "date");
  const [credits, setCredits] = useField<string>(P, "credits");
  return (
    <>
      <ImageSlot label="Poster photo" path={[...P, "img"]} />
      <TextField label="Title" value={title} onChange={setTitle} tip={HIGHLIGHT_TIP} />
      <ImageSlot
        label="Title logo"
        path={[...P, "logo"]}
        contain
        empty="Optional. A transparent PNG of the title. Without one, the title text is used."
      />
      <TextField label="Tagline" area value={tagline} onChange={setTagline} tip="Shown above the title. Leave empty to hide it." />
      <Group title="Extras (leave any empty to hide it)">
        <TextField label="Names across the top" value={top} onChange={setTop} tip="Usually the cast." />
        <TextField label="Release line" value={date} onChange={setDate} tip="e.g. In cinemas June 2" />
        <TextField label="Credits" area value={credits} onChange={setCredits} tip="The small print at the bottom." />
      </Group>
    </>
  );
}
