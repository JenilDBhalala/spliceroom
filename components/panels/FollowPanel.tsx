import { useEditor, useField } from "@/lib/store";
import TextField from "@/components/fields/TextField";
import { HIGHLIGHT_TIP, Note } from "./ui";

export default function FollowPanel() {
  const [cta, setCta] = useField<string>(["brand"], "cta");
  const setMode = useEditor((s) => s.setMode);
  return (
    <>
      <TextField label="Headline" area value={cta} onChange={setCta} tip={HIGHLIGHT_TIP} />
      <Note>The card uses your profile: picture, name, numbers and bio. Fill it in once and every post reuses it.</Note>
      <button type="button" className="btn self-start" onClick={() => setMode("brand")}>
        Edit my profile
      </button>
    </>
  );
}
