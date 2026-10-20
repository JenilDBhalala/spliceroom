import type { Brand } from "@/types/post";
import { useEditor } from "@/lib/store";
import ColorField from "@/components/fields/ColorField";
import ImageSlot from "@/components/fields/ImageSlot";
import SelectField from "@/components/fields/SelectField";
import TextField from "@/components/fields/TextField";
import Toggle from "@/components/fields/Toggle";
import { Group, Note, PanelHeader, Row } from "./ui";

const EXPORT_SIZES = [
  [2, "2160 × 2700 (sharper)"],
  [1, "1080 × 1350 (Instagram size)"],
] as const;

export default function BrandPanel() {
  const brand = useEditor((s) => s.brand);
  const update = useEditor((s) => s.update);
  const setMode = useEditor((s) => s.setMode);
  const set = (patch: Partial<Brand>) => update(["brand"], patch);
  const text = (label: string, key: "name" | "display" | "posts" | "followers" | "following" | "bio" | "link" | "cta", extra = {}) => (
    <TextField label={label} value={brand[key]} onChange={(v) => set({ [key]: v })} {...extra} />
  );
  return (
    <>
      <PanelHeader title="Brand & profile">
        <button type="button" className="btn btn-small btn-primary" onClick={() => setMode("slide")}>
          Done
        </button>
      </PanelHeader>
      <Note>Saved in this browser and used on every post.</Note>
      <Group title="Page">
        {text("Page name", "name", { tip: "Shown top left on headline covers when there is no logo image." })}
        <ImageSlot label="Logo image" path={["brand", "logo"]} contain empty="Optional transparent PNG. Replaces the page name." />
        <ColorField label="Theme color" value={brand.accent} onChange={(accent) => set({ accent })} />
      </Group>
      <Group title="Follow card profile">
        <ImageSlot label="Profile picture" path={["brand", "avatar"]} empty="Optional. Without one, your logo or page name is used." />
        {text("Display name", "display")}
        <Toggle label="Blue tick" checked={brand.verified} onChange={(verified) => set({ verified })} />
        <Row>
          {text("Posts", "posts")}
          {text("Followers", "followers")}
          {text("Following", "following")}
        </Row>
        {text("Bio", "bio", { area: true, tip: "One line per row, up to 5. @handles show in purple." })}
        {text("Link", "link")}
        {text("Follow headline", "cta", { area: true })}
      </Group>
      <Group title="Download">
        <SelectField
          label="Image size"
          value={brand.exportScale}
          options={EXPORT_SIZES}
          onChange={(exportScale) => set({ exportScale })}
        />
        <Note>Both are 4:5. The sharper size stays crisp when zoomed in; Instagram scales it down on upload.</Note>
      </Group>
    </>
  );
}
