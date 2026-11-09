import type { MemePost } from "@/types/post";
import { useEditor, useField } from "@/lib/store";
import { barColorOf } from "@/lib/render/meme";
import ColorField from "@/components/fields/ColorField";
import ImageSlot from "@/components/fields/ImageSlot";
import Segmented from "@/components/fields/Segmented";
import TextField from "@/components/fields/TextField";
import { HIGHLIGHT_TIP } from "./ui";

const P = ["posts", "meme"] as const;
const PLACES = [
  ["top", "Above"],
  ["bottom", "Below"],
] as const;
const PADS = [
  ["none", "None"],
  ["small", "Small"],
  ["large", "Large"],
] as const;
const MODES = [
  ["classic", "Text on photo"],
  ["caption", "Caption above"],
] as const;

export default function MemePanel() {
  const mode = useEditor((s) => s.posts.meme.mode);
  const setMemeMode = useEditor((s) => s.setMemeMode);
  const barColor = useEditor((s) => barColorOf(s.posts.meme));
  const setMemeBar = useEditor((s) => s.setMemeBar);
  const [captionAt, setCaptionAt] = useField<MemePost["captionAt"]>(P, "captionAt");
  const [pad, setPad] = useField<MemePost["pad"]>(P, "pad");
  const [top, setTop] = useField<string>(P, "top");
  const [bottom, setBottom] = useField<string>(P, "bottom");
  const [caption, setCaption] = useField<string>(P, "caption");
  return (
    <>
      <Segmented<MemePost["mode"]> label="Meme style" value={mode} options={MODES} onChange={setMemeMode} />
      {mode === "caption" && (
        <>
          <TextField label="Caption" area value={caption} onChange={setCaption} tip={HIGHLIGHT_TIP} />
          <Segmented<NonNullable<MemePost["captionAt"]>> label="Caption" value={captionAt ?? "top"} options={PLACES} onChange={setCaptionAt} />
          <ColorField label="Caption background" value={barColor} onChange={setMemeBar} />
          <Segmented<NonNullable<MemePost["pad"]>> label="Space around the photo" value={pad ?? "none"} options={PADS} onChange={setPad} />
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
