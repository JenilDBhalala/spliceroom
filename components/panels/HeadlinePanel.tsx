import type { Slide } from "@/types/post";
import { useField } from "@/lib/store";
import ImageSlot from "@/components/fields/ImageSlot";
import TextField from "@/components/fields/TextField";
import Toggle from "@/components/fields/Toggle";
import { Group, HIGHLIGHT_TIP, Note } from "./ui";

const P = ["posts", "headline"] as const;

export default function HeadlinePanel({ slide }: { slide: Slide }) {
  const [text, setText] = useField<string>(P, "text");
  const [logo, setLogo] = useField<boolean>(P, "logo");
  const [swipe, setSwipe] = useField<boolean>(P, "swipe");
  const [clean, setClean] = useField<boolean>(P, "clean");

  if (slide.kind === "hlClean") {
    return (
      <>
        <Note>This slide shows the cover photo with no text. Its framing is set separately from the cover.</Note>
        <ImageSlot label="Cover photo" path={[...P, "img"]} framingPath={[...P, "cleanAdj"]} />
      </>
    );
  }
  return (
    <>
      <ImageSlot label="Photo" path={[...P, "img"]} />
      <TextField label="Headline" area value={text} onChange={setText} tip={HIGHLIGHT_TIP} />
      <Group title="On the cover">
        <Toggle label="Page logo, top left" checked={logo} onChange={setLogo} />
        <Toggle label={'"Swipe left", top right'} checked={swipe} onChange={setSwipe} />
      </Group>
      <Group title="Post">
        <Toggle label="Add the clean photo as slide 2" checked={clean} onChange={setClean} />
      </Group>
    </>
  );
}
