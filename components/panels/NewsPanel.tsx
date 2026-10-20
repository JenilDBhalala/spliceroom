import type { Slide, Story } from "@/types/post";
import { useEditor, useField } from "@/lib/store";
import ImageSlot from "@/components/fields/ImageSlot";
import TextField from "@/components/fields/TextField";
import Toggle from "@/components/fields/Toggle";
import { Group, HIGHLIGHT_TIP, OrderButtons } from "./ui";

const P = ["posts", "news"] as const;

export default function NewsPanel({ slide }: { slide: Slide }) {
  return slide.kind === "newsStory" ? <StorySlide i={slide.i!} /> : <Cover />;
}

function Cover() {
  const [insetOn, setInsetOn] = useField<boolean>(P, "insetOn");
  const [text, setText] = useField<string>(P, "text");
  const [swipe, setSwipe] = useField<boolean>(P, "swipe");
  const [follow, setFollow] = useField<boolean>(P, "follow");
  return (
    <>
      <ImageSlot label="Cover photo" path={[...P, "img"]} />
      <ImageSlot label="Round inset photo" path={[...P, "inset"]} tip="Usually the real person behind the character." />
      <Toggle label="Show round inset" checked={insetOn} onChange={setInsetOn} />
      <TextField
        label="Headline"
        area
        value={text}
        onChange={setText}
        tip="Each line stretches to the full width. Press Enter where a new line should start."
      />
      <Group title="Post">
        <Toggle label={'"Swipe" tag'} checked={swipe} onChange={setSwipe} />
        <Toggle label="End with your follow card" checked={follow} onChange={setFollow} />
      </Group>
    </>
  );
}

function StorySlide({ i }: { i: number }) {
  const st = useEditor((s) => s.posts.news.stories[i]) as Story | undefined;
  const count = useEditor((s) => s.posts.news.stories.length);
  const update = useEditor((s) => s.update);
  const moveItem = useEditor((s) => s.moveItem);
  const deleteItem = useEditor((s) => s.deleteItem);
  if (!st) return null;
  const path = [...P, "stories", i];
  return (
    <>
      <ImageSlot key={st.id} label="Photo" path={[...path, "img"]} />
      <TextField
        label="Text"
        area
        value={st.text}
        onChange={(text) => update(path, { text })}
        tip={`Leave an empty line between paragraphs. ${HIGHLIGHT_TIP}`}
      />
      <Group title="Order">
        <OrderButtons index={i} count={count} what="slide" onMove={(d) => moveItem("news", i, d)} onDelete={() => deleteItem("news", i)} />
      </Group>
    </>
  );
}
