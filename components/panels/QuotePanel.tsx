import { useField } from "@/lib/store";
import ColorField from "@/components/fields/ColorField";
import ImageSlot from "@/components/fields/ImageSlot";
import Segmented from "@/components/fields/Segmented";
import TextField from "@/components/fields/TextField";
import { Group, HIGHLIGHT_TIP } from "./ui";

const P = ["posts", "quote"] as const;
const BACKGROUNDS = [
  ["photo", "Photo"],
  ["color", "Solid color"],
] as const;

export default function QuotePanel() {
  const [quote, setQuote] = useField<string>(P, "quote");
  const [author, setAuthor] = useField<string>(P, "author");
  const [source, setSource] = useField<string>(P, "source");
  const [usePhoto, setUsePhoto] = useField<boolean>(P, "usePhoto");
  const [background, setBackground] = useField<string>(P, "background");
  return (
    <>
      <TextField label="Quote" area value={quote} onChange={setQuote} tip={HIGHLIGHT_TIP} />
      <TextField label="Who said it" value={author} onChange={setAuthor} />
      <TextField label="Where it's from" value={source} onChange={setSource} tip="e.g. the movie and year. Leave empty to hide it." />
      <Group title="Background">
        <Segmented label="Background" value={usePhoto ? "photo" : "color"} options={BACKGROUNDS} onChange={(v) => setUsePhoto(v === "photo")} />
        {usePhoto ? <ImageSlot label="Photo" path={[...P, "img"]} tip="Darkened so the quote stays readable." /> : <ColorField label="Color" value={background} onChange={setBackground} />}
      </Group>
    </>
  );
}
