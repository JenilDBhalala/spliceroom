import type { QuotePost } from "@/types/post";
import { useField } from "@/lib/store";
import ColorField from "@/components/fields/ColorField";
import ImageSlot from "@/components/fields/ImageSlot";
import Segmented from "@/components/fields/Segmented";
import Slider from "@/components/fields/Slider";
import TextField from "@/components/fields/TextField";
import Toggle from "@/components/fields/Toggle";
import { Group, HIGHLIGHT_TIP } from "./ui";

const P = ["posts", "quote"] as const;
const ALIGNS = [
  ["center", "Center"],
  ["left", "Left"],
] as const;
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
  const [darken, setDarken] = useField<number | undefined>(P, "darken");
  const [mark, setMark] = useField<boolean | undefined>(P, "mark");
  const [align, setAlign] = useField<QuotePost["align"]>(P, "align");
  return (
    <>
      <TextField label="Quote" area value={quote} onChange={setQuote} tip={HIGHLIGHT_TIP} />
      <TextField label="Who said it" value={author} onChange={setAuthor} />
      <TextField label="Where it's from" value={source} onChange={setSource} tip="e.g. the movie and year. Leave empty to hide it." />
      <Segmented<NonNullable<QuotePost["align"]>> label="Align" value={align ?? "center"} options={ALIGNS} onChange={setAlign} />
      <Toggle label="Big quote mark" checked={mark ?? true} onChange={setMark} />
      <Group title="Background">
        <Segmented label="Background" value={usePhoto ? "photo" : "color"} options={BACKGROUNDS} onChange={(v) => setUsePhoto(v === "photo")} />
        {usePhoto ? (
          <>
            <ImageSlot label="Photo" path={[...P, "img"]} />
            <Slider label="Darken the photo" value={darken ?? 0.55} min={0} max={0.85} step={0.05} format={(v) => `${Math.round(v * 100)}%`} onChange={setDarken} />
          </>
        ) : (
          <ColorField label="Color" value={background} onChange={setBackground} />
        )}
      </Group>
    </>
  );
}
