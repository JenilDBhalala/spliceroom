import type { MemePost } from "@/types/post";
import { useEditor, useField } from "@/lib/store";
import ImageSlot from "@/components/fields/ImageSlot";
import Segmented from "@/components/fields/Segmented";
import TextField from "@/components/fields/TextField";
import { HIGHLIGHT_TIP } from "./ui";

const P = ["posts", "meme"] as const;
const BARS = [
  ["light", "Light"],
  ["dark", "Dark"],
] as const;
const MODES = [
  ["classic", "Text on photo"],
  ["caption", "Caption above"],
] as const;

export default function MemePanel() {
  const mode = useEditor((s) => s.posts.meme.mode);
  const setMemeMode = useEditor((s) => s.setMemeMode);
  const bar = useEditor((s) => s.posts.meme.bar);
  const setMemeBar = useEditor((s) => s.setMemeBar);
  const [top, setTop] = useField<string>(P, "top");
  const [bottom, setBottom] = useField<string>(P, "bottom");
  const [caption, setCaption] = useField<string>(P, "caption");
  return (
    <>
      <Segmented<MemePost["mode"]> label="Meme style" value={mode} options={MODES} onChange={setMemeMode} />
      {mode === "caption" && (
        <>
          <TextField label="Caption" area value={caption} onChange={setCaption} tip={HIGHLIGHT_TIP} />
          <Segmented<MemePost["bar"]> label="Caption background" value={bar} options={BARS} onChange={setMemeBar} />
        </>
      )}
      <ImageSlot label="Photo" path={[...P, "img"]} />
      {mode === "classic" && (
        <>
          <TextField label="Top text" value={top} onChange={setTop} tip="Leave empty for bottom text only." />
          <TextField label="Bottom text" value={bottom} onChange={setBottom} tip={HIGHLIGHT_TIP} />
        </>
      )}
    </>
  );
}
