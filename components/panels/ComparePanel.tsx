import type { ComparePost } from "@/types/post";
import { useField } from "@/lib/store";
import ImageSlot from "@/components/fields/ImageSlot";
import Segmented from "@/components/fields/Segmented";
import TextField from "@/components/fields/TextField";
import Toggle from "@/components/fields/Toggle";
import { HIGHLIGHT_TIP } from "./ui";

const P = ["posts", "compare"] as const;
const LAYOUTS = [
  ["side", "Side by side"],
  ["stack", "Top and bottom"],
] as const;

export default function ComparePanel() {
  const [layout, setLayout] = useField<ComparePost["layout"]>(P, "layout");
  const [headline, setHeadline] = useField<string>(P, "headline");
  const [leftLabel, setLeftLabel] = useField<string>(P, "leftLabel");
  const [rightLabel, setRightLabel] = useField<string>(P, "rightLabel");
  const [vs, setVs] = useField<boolean>(P, "vs");
  const [first, second] = layout === "side" ? ["Left", "Right"] : ["Top", "Bottom"];
  return (
    <>
      <TextField label="Headline" value={headline} onChange={setHeadline} tip={`Leave empty for photos only. ${HIGHLIGHT_TIP}`} />
      <Segmented<ComparePost["layout"]> label="Layout" value={layout} options={LAYOUTS} onChange={setLayout} />
      <fieldset className="m-0 flex min-w-0 flex-col gap-3 rounded-xl border border-line p-3">
        <legend className="px-1.5 text-[11px] font-bold tracking-[.12em] text-muted uppercase">{first}</legend>
        <ImageSlot label="Photo" path={[...P, "left"]} />
        <TextField label="Label" value={leftLabel} onChange={setLeftLabel} tip="Leave empty to hide it." />
      </fieldset>
      <fieldset className="m-0 flex min-w-0 flex-col gap-3 rounded-xl border border-line p-3">
        <legend className="px-1.5 text-[11px] font-bold tracking-[.12em] text-muted uppercase">{second}</legend>
        <ImageSlot label="Photo" path={[...P, "right"]} />
        <TextField label="Label" value={rightLabel} onChange={setRightLabel} tip="Leave empty to hide it." />
      </fieldset>
      <Toggle label={'"VS" badge in the middle'} checked={vs} onChange={setVs} />
    </>
  );
}
