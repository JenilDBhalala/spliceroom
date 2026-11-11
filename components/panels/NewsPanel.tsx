import type { NewsPost, Slide, Story } from "@/types/post";
import { useEditor, useField } from "@/lib/store";
import NewsLink from "@/components/NewsLink";
import ImageSlot from "@/components/fields/ImageSlot";
import Segmented from "@/components/fields/Segmented";
import TextField from "@/components/fields/TextField";
import Toggle from "@/components/fields/Toggle";
import { DesignChoices, FoundPhotos, HeadlineChoices } from "./NewsChoices";
import { Group, HIGHLIGHT_TIP, OrderButtons, Row } from "./ui";

const P = ["posts", "news"] as const;

export default function NewsPanel({ slide }: { slide: Slide }) {
  return slide.kind === "newsStory" ? <StorySlide i={slide.i!} /> : <Cover />;
}

const COVER_STYLES = [
  ["even", "Even lines"],
  ["stretch", "Stretched"],
] as const;

function Cover() {
  const [insetOn, setInsetOn] = useField<boolean>(P, "insetOn");
  const [coverStyle, setCoverStyle] = useField<NewsPost["coverStyle"]>(P, "coverStyle");
  const design = useEditor((s) => s.posts.news.design ?? "photo");
  const [text, setText] = useField<string>(P, "text");
  const [tag, setTag] = useField<string | undefined>(P, "tag");
  const [source, setSource] = useField<string | undefined>(P, "source");
  const [swipe, setSwipe] = useField<boolean>(P, "swipe");
  const [follow, setFollow] = useField<boolean>(P, "follow");
  return (
    <>
      <NewsLink from="news_panel" />
      <DesignChoices />
      <ImageSlot label="Cover photo" path={[...P, "img"]} />
      <FoundPhotos path={[...P, "img"]} />
      {design === "photo" && (
        <>
          <ImageSlot label="Round inset photo" path={[...P, "inset"]} tip="Usually the real person behind the character." />
          <Toggle label="Show round inset" checked={insetOn} onChange={setInsetOn} />
        </>
      )}
      <HeadlineChoices />
      <TextField
        label="Headline"
        area
        value={text}
        onChange={setText}
        tip={coverStyle === "even" ? "Lines wrap by themselves." : "Each line stretches to the full width. Press Enter where a new line should start."}
      />
      {design === "photo" && (
        <Segmented<NonNullable<NewsPost["coverStyle"]>> label="Headline look" value={coverStyle ?? "stretch"} options={COVER_STYLES} onChange={setCoverStyle} />
      )}
      <Row>
        <TextField label="Tag above" value={tag ?? ""} onChange={setTag} tip="e.g. BREAKING or EXCLUSIVE. Empty hides it." />
        <TextField label="Source line" value={source ?? ""} onChange={setSource} tip="e.g. Source: Variety. Empty hides it." />
      </Row>
      <Group title="Post">
        <Toggle label={'"Swipe for more" on every slide but the last'} checked={swipe} onChange={setSwipe} />
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
      <FoundPhotos path={[...path, "img"]} />
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
