import { useEffect, useState } from "react";
import type { TweetPost } from "@/types/post";
import { notifyRedraw } from "@/lib/images";
import { nowStamp } from "@/lib/render/tweet";
import { useEditor, useField } from "@/lib/store";
import ColorField from "@/components/fields/ColorField";
import ImageSlot from "@/components/fields/ImageSlot";
import Segmented from "@/components/fields/Segmented";
import TextField from "@/components/fields/TextField";
import Toggle from "@/components/fields/Toggle";
import { Group, HIGHLIGHT_TIP, Note, Row } from "./ui";

const P = ["posts", "tweet"] as const;
const SHAPES = [
  ["auto", "Auto"],
  ["wide", "Wide"],
  ["square", "Square"],
  ["tall", "Tall"],
  ["original", "Original"],
] as const;
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
  const [autoDate, setAutoDate] = useField<boolean>(P, "autoDate");
  const [imgShape, setImgShape] = useField<TweetPost["imgShape"]>(P, "imgShape");
  const [background, setBackground] = useField<string>(P, "background");
  // Keep the clock current: re-render the note and redraw the canvas as minutes pass.
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!autoDate) return;
    const t = setInterval(() => {
      setTick((n) => n + 1);
      notifyRedraw();
    }, 20_000);
    return () => clearInterval(t);
  }, [autoDate]);
  return (
    <>
      <TextField label="Post text" area value={text} onChange={setText} tip={HIGHLIGHT_TIP} />
      <Toggle label="Add an image" checked={showImage} onChange={setShowImage} />
      {showImage && (
        <>
          <ImageSlot label="Image" path={[...P, "img"]} />
          <Segmented<TweetPost["imgShape"]> label="Image shape" value={imgShape ?? "auto"} options={SHAPES} onChange={setImgShape} />
        </>
      )}
      <Toggle
        label="Use the current time"
        checked={autoDate}
        onChange={(on) => {
          // Turning it off starts the text field from the time shown now.
          if (!on) setDate(nowStamp());
          setAutoDate(on);
        }}
      />
      {autoDate ? (
        <Note>{`Shows ${nowStamp()} in your own date format, and updates by itself.`}</Note>
      ) : (
        <TextField label="Time and date" value={date} onChange={setDate} tip="Leave empty to hide it." />
      )}
      <Group title="Who posted it">
        <Toggle label="Use my profile" checked={useBrand} onChange={setUseBrand} />
        {useBrand ? (
          <>
            <Note>Uses your display name, page name, profile picture and tick.</Note>
            <button type="button" className="btn btn-small self-start" onClick={() => setMode("brand")}>
              Edit my profile
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
