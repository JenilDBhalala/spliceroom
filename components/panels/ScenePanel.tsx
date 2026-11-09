import type { ScenePost } from "@/types/post";
import { useField } from "@/lib/store";
import ImageSlot from "@/components/fields/ImageSlot";
import Segmented from "@/components/fields/Segmented";
import TextField from "@/components/fields/TextField";
import Toggle from "@/components/fields/Toggle";
import { Group, HIGHLIGHT_TIP } from "./ui";

const P = ["posts", "scene"] as const;
const BARS = [
  ["none", "None"],
  ["thin", "Film"],
  ["wide", "Cinema"],
] as const;
const COLORS = [
  ["yellow", "Yellow"],
  ["white", "White"],
] as const;

export default function ScenePanel() {
  const [bars, setBars] = useField<ScenePost["bars"]>(P, "bars");
  const [subtitle, setSubtitle] = useField<string>(P, "subtitle");
  const [subColor, setSubColor] = useField<ScenePost["subColor"]>(P, "subColor");
  const [italic, setItalic] = useField<boolean>(P, "italic");
  const [caption, setCaption] = useField<string>(P, "caption");
  return (
    <>
      <ImageSlot label="Movie still" path={[...P, "img"]} />
      <Segmented<ScenePost["bars"]> label="Black bars" value={bars} options={BARS} onChange={setBars} />
      <Group title="Subtitle">
        <TextField label="Subtitle" area value={subtitle} onChange={setSubtitle} tip="One or two short lines, like the movie's subtitles. Empty hides it." />
        <Segmented<ScenePost["subColor"]> label="Color" value={subColor} options={COLORS} onChange={setSubColor} />
        <Toggle label="Italic" checked={italic} onChange={setItalic} />
      </Group>
      <Group title="Caption">
        <TextField label="Caption above" area value={caption} onChange={setCaption} tip={`e.g. POV: … Empty hides it. ${HIGHLIGHT_TIP}`} />
      </Group>
    </>
  );
}
