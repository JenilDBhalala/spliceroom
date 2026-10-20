import type { Lesson, LessonsPost, Slide } from "@/types/post";
import { useEditor, useField } from "@/lib/store";
import ImageSlot from "@/components/fields/ImageSlot";
import SelectField from "@/components/fields/SelectField";
import TextField from "@/components/fields/TextField";
import Toggle from "@/components/fields/Toggle";
import { Group, HIGHLIGHT_TIP, OrderButtons } from "./ui";

const P = ["posts", "lessons"] as const;
const NUMBER_STYLES = [
  ["small", "Small"],
  ["large", "Large"],
  ["off", "Hidden"],
] as const;

/** Shared by the cover and every lesson slide, since it applies to the whole post. */
function NumbersField() {
  const [numbers, setNumbers] = useField<LessonsPost["numbers"]>(P, "numbers");
  return <SelectField label="Lesson numbers" value={numbers} options={NUMBER_STYLES} onChange={setNumbers} />;
}

export default function LessonsPanel({ slide }: { slide: Slide }) {
  return slide.kind === "lessonItem" ? <LessonSlide i={slide.i!} /> : <Cover />;
}

function Cover() {
  const [kicker, setKicker] = useField<string>(P, "kicker");
  const [title, setTitle] = useField<string>(P, "title");
  const [brandLogo, setBrandLogo] = useField<boolean>(P, "brandLogo");
  const [swipe, setSwipe] = useField<boolean>(P, "swipe");
  const [follow, setFollow] = useField<boolean>(P, "follow");
  return (
    <>
      <ImageSlot label="Cover photo" path={[...P, "img"]} />
      <TextField label="Top line" value={kicker} onChange={setKicker} tip="Small accent line above the title. Leave empty to hide it." />
      <TextField label="Movie title" value={title} onChange={setTitle} tip={HIGHLIGHT_TIP} />
      <ImageSlot
        label="Title logo"
        path={[...P, "logo"]}
        contain
        empty="Optional. A transparent PNG of the title. Without one, the title text is used."
      />
      <Group title="On the cover">
        <Toggle label="Page logo, top left" checked={brandLogo} onChange={setBrandLogo} />
        <Toggle label={'"Swipe" tag'} checked={swipe} onChange={setSwipe} />
      </Group>
      <Group title="Post">
        <NumbersField />
        <Toggle label="End with your follow card" checked={follow} onChange={setFollow} />
      </Group>
    </>
  );
}

function LessonSlide({ i }: { i: number }) {
  const ls = useEditor((s) => s.posts.lessons.lessons[i]) as Lesson | undefined;
  const count = useEditor((s) => s.posts.lessons.lessons.length);
  const update = useEditor((s) => s.update);
  const moveItem = useEditor((s) => s.moveItem);
  const deleteItem = useEditor((s) => s.deleteItem);
  if (!ls) return null;
  const path = [...P, "lessons", i];
  return (
    <>
      <ImageSlot key={ls.id} label="Photo" path={[...path, "img"]} />
      <TextField label="Lesson" value={ls.title} onChange={(title) => update(path, { title })} tip="Short and punchy, e.g. Seize the day." />
      <TextField
        label="Text"
        area
        value={ls.text}
        onChange={(text) => update(path, { text })}
        tip={`Leave an empty line between paragraphs. ${HIGHLIGHT_TIP}`}
      />
      <Group title="Post">
        <NumbersField />
      </Group>
      <Group title="Order">
        <OrderButtons index={i} count={count} what="lesson" onMove={(d) => moveItem("lessons", i, d)} onDelete={() => deleteItem("lessons", i)} />
      </Group>
    </>
  );
}
