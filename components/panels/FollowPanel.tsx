import { useEditor, useField } from "@/lib/store";
import TextField from "@/components/fields/TextField";
import { HIGHLIGHT_TIP, Note } from "./ui";

export default function FollowPanel() {
  const [cta, setCta] = useField<string>(["brand"], "cta");
  const setMode = useEditor((s) => s.setMode);
  return (
    <>
      <TextField label="Headline" area value={cta} onChange={setCta} tip={HIGHLIGHT_TIP} />
      <Note>The profile card uses your saved brand details. They are reused on every post.</Note>
      <button type="button" className="btn self-start" onClick={() => setMode("brand")}>
        Edit profile and logo
      </button>
    </>
  );
}
