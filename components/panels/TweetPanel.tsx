import type { TweetPost } from "@/types/post";
import { useEditor, useField } from "@/lib/store";
import ColorField from "@/components/fields/ColorField";
import ImageSlot from "@/components/fields/ImageSlot";
import Segmented from "@/components/fields/Segmented";
import TextField from "@/components/fields/TextField";
import Toggle from "@/components/fields/Toggle";
import { Group, HIGHLIGHT_TIP, Note, Row } from "./ui";

const P = ["posts", "tweet"] as const;
const THEMES = [
  ["dark", "Dark"],
  ["light", "Light"],
] as const;

export default function TweetPanel() {
  const theme = useEditor((s) => s.posts.tweet.theme);
  const setTweetTheme = useEditor((s) => s.setTweetTheme);
  const setMode = useEditor((s) => s.setMode);
  const [text, setText] = useField<string>(P, "text");
  const [useBrand, setUseBrand] = useField<boolean>(P, "useBrand");
  const [name, setName] = useField<string>(P, "name");
  const [handle, setHandle] = useField<string>(P, "handle");
  const [verified, setVerified] = useField<boolean>(P, "verified");
  const [showImage, setShowImage] = useField<boolean>(P, "showImage");
  const [date, setDate] = useField<string>(P, "date");
  const [background, setBackground] = useField<string>(P, "background");
  return (
    <>
      <TextField label="Post text" area value={text} onChange={setText} tip={HIGHLIGHT_TIP} />
      <Toggle label="Add an image" checked={showImage} onChange={setShowImage} />
      {showImage && <ImageSlot label="Image" path={[...P, "img"]} />}
      <TextField label="Time and date" value={date} onChange={setDate} tip="Leave empty to hide it." />
      <Group title="Who posted it">
        <Toggle label="Use my brand profile" checked={useBrand} onChange={setUseBrand} />
        {useBrand ? (
          <>
            <Note>Uses your display name, page name, profile picture and tick.</Note>
            <button type="button" className="btn btn-small self-start" onClick={() => setMode("brand")}>
              Edit brand profile
            </button>
          </>
        ) : (
          <>
            <Row>
              <TextField label="Name" value={name} onChange={setName} />
              <TextField label="Handle" value={handle} onChange={setHandle} />
            </Row>
            <ImageSlot label="Profile picture" path={[...P, "avatar"]} empty="Optional. Without one, the first letter of the name is used." />
            <Toggle label="Blue tick" checked={verified} onChange={setVerified} />
          </>
        )}
      </Group>
      <Group title="Look">
        <Segmented<TweetPost["theme"]> label="Card" value={theme} options={THEMES} onChange={setTweetTheme} />
        <ColorField label="Background" value={background} onChange={setBackground} />
      </Group>
    </>
  );
}
