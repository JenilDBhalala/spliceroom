import type { Brand, Posts, SlideKind, StyledKey } from "@/types/post";
import { toastUndo } from "@/lib/history";
import { POST_OF } from "@/lib/render";
import { useEditor, useSlides } from "@/lib/store";
import { templateInfo } from "@/lib/templates";
import LegalLinks from "./LegalLinks";
import BrandPanel from "./panels/BrandPanel";
import ComparePanel from "./panels/ComparePanel";
import CustomPanel from "./panels/CustomPanel";
import FollowPanel from "./panels/FollowPanel";
import { AddToSlide, LayerEditor } from "./panels/Layers";
import HeadlinePanel from "./panels/HeadlinePanel";
import LessonsPanel from "./panels/LessonsPanel";
import ListPanel from "./panels/ListPanel";
import MemePanel from "./panels/MemePanel";
import NewsPanel from "./panels/NewsPanel";
import PosterPanel from "./panels/PosterPanel";
import QuotePanel from "./panels/QuotePanel";
import ScenePanel from "./panels/ScenePanel";
import SelectedText from "./panels/SelectedText";
import StyleSection from "./panels/StyleSection";
import TimelinePanel from "./panels/TimelinePanel";
import TweetPanel from "./panels/TweetPanel";
import Segmented from "./fields/Segmented";
import Toggle from "./fields/Toggle";
import { Note, PanelHeader, SlideCount } from "./panels/ui";

const TITLES: Record<SlideKind, string> = {
  custom: "Blank canvas",
  hlCover: "Headline cover",
  hlClean: "Clean photo",
  listCover: "List cover",
  listItem: "Movie card",
  newsCover: "News cover",
  newsStory: "Story slide",
  lessonsCover: "Lessons cover",
  lessonItem: "Lesson",
  timeline: "Timeline",
  poster: "Movie poster",
  meme: "Meme",
  tweet: "Tweet / X post",
  quote: "Quote",
  compare: "Comparison",
  follow: "Follow card",
  scene: "Movie scene",
};

/** Slides where the text style only reaches the cover, so the section says so. */
const STYLE_NOTES: Partial<Record<SlideKind, string>> = {
  hlClean: "Applies to the headline on the cover.",
  listItem: "Applies to the cover headline and highlight color. Each movie picks its own title font above.",
  newsStory: "Applies to the cover headline and highlight color.",
  timeline: "Applies to the movie titles.",
  tweet: "Applies to the post text.",
  scene: "Applies to the caption above the still. Tap the subtitle on the post for its own font and color.",
};

/** Which text style the current slide edits (null on the blank canvas, where each layer has its own). */
export function useStyleTarget(): { key: StyledKey | null; note?: string } {
  const fmt = useEditor((s) => s.fmt);
  const { slides, sel } = useSlides();
  const k = slides[sel].kind;
  return { key: k === "follow" ? "follow" : fmt === "custom" ? null : (fmt as StyledKey), note: STYLE_NOTES[k] };
}

/** The selected slide's fields; `withStyle` adds the text style section (the phone layout shows it in its own tab). */
export function SlideFields({ withStyle = true }: { withStyle?: boolean }) {
  const fmt = useEditor((s) => s.fmt);
  const resetTemplate = useEditor((s) => s.resetTemplate);
  const textSel = useEditor((s) => s.textSel);
  const { slides, sel } = useSlides();
  const style = useStyleTarget();
  const slide = slides[sel];
  const k = slide.kind;
  return (
    <>
      <PanelHeader title={TITLES[k]}>{slides.length > 1 && <SlideCount sel={sel} total={slides.length} />}</PanelHeader>
      {textSel?.key.startsWith(`${k}.`) && <SelectedText key={textSel.key} block={textSel} />}
      {k !== "custom" && <LayerEditor />}
      <Note>{templateInfo(fmt).howto}</Note>
      {k !== "custom" && <TextPositions post={POST_OF[k]} />}
      {k !== "follow" && <PageNameToggle post={k === "custom" ? "custom" : POST_OF[k]} />}
      {(k === "hlCover" || k === "hlClean") && <HeadlinePanel slide={slide} />}
      {(k === "listCover" || k === "listItem") && <ListPanel slide={slide} />}
      {(k === "newsCover" || k === "newsStory") && <NewsPanel slide={slide} />}
      {(k === "lessonsCover" || k === "lessonItem") && <LessonsPanel slide={slide} />}
      {k === "timeline" && <TimelinePanel />}
      {k === "poster" && <PosterPanel />}
      {k === "meme" && <MemePanel />}
      {k === "tweet" && <TweetPanel />}
      {k === "quote" && <QuotePanel />}
      {k === "compare" && <ComparePanel />}
      {k === "follow" && <FollowPanel />}
      {k === "scene" && <ScenePanel />}
      {k === "custom" ? <CustomPanel /> : <AddToSlide />}
      {withStyle && style.key && <StyleSection key={style.key} postKey={style.key} note={style.note} />}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <span className="flex items-center gap-2 text-xs text-muted">
          <i aria-hidden className="inline-block size-2 rounded-full bg-accent" />
          Changes are saved on this device
        </span>
        <button
          type="button"
          className="btn btn-small btn-ghost btn-danger"
          onClick={() => {
            resetTemplate(fmt as keyof Posts);
            toastUndo(`${templateInfo(fmt).name} is back to the sample.`);
          }}
        >
          Start over
        </button>
      </div>
      <LegalLinks />
    </>
  );
}

/** "@pagename" in a corner, on any template (drag it anywhere once it shows). */
function PageNameToggle({ post }: { post: keyof Posts }) {
  const on = useEditor((s) => !!(s.posts[post] as { watermark?: boolean }).watermark);
  const brand = useEditor((s) => s.brand);
  const update = useEditor((s) => s.update);
  const name = brand.name || "yourpage";
  const hasLogo = !!brand.logo.src;
  const as = brand.markAs ?? (hasLogo ? "logo" : "handle");
  const options: [NonNullable<Brand["markAs"]>, string][] = [
    ["handle", `@${name}`],
    ["name", name],
    ...(hasLogo ? [["logo", "Logo"] as [NonNullable<Brand["markAs"]>, string]] : []),
  ];
  return (
    <>
      <Toggle label="Show your page name on the post" checked={on} onChange={(watermark) => update(["posts", post], { watermark })} />
      {on && (
        <>
          <Segmented<NonNullable<Brand["markAs"]>> label="Show as" value={as === "logo" && !hasLogo ? "handle" : as} options={options} onChange={(markAs) => update(["brand"], { markAs })} />
          {!hasLogo && <Note>Add a logo image under Profile to show it here instead.</Note>}
        </>
      )}
    </>
  );
}

/** Says text can be dragged, and puts it all back once something was moved. */
function TextPositions({ post }: { post: (typeof POST_OF)[keyof typeof POST_OF] }) {
  const moved = useEditor((s) => Object.keys({ ...s.posts[post].moves, ...s.posts[post].looks }).length > 0);
  const update = useEditor((s) => s.update);
  return (
    <div className="flex items-center gap-3 rounded-lg border border-dashed border-line px-3 py-2.5">
      <span aria-hidden className="text-base leading-none">✥</span>
      <p className="m-0 flex-1 text-[12.5px] leading-snug text-muted">
        Drag any text on the post to move it, pinch or scroll to resize. Tap it for its own color, font and more.
      </p>
      {moved && (
        <button
          type="button"
          className="btn btn-small flex-none"
          onClick={() => {
            update(["posts", post], { moves: undefined, looks: undefined });
            toastUndo("All text is back to the template's look.");
          }}
        >
          Reset
        </button>
      )}
    </div>
  );
}

/** Desktop and tablet side panel: the selected slide's fields, or brand settings. */
export default function SlidePanel() {
  const mode = useEditor((s) => s.mode);
  return (
    <aside
      aria-live="polite"
      className="flex min-w-0 flex-col gap-[18px] overflow-auto border-l border-line bg-panel pt-5 pr-[max(20px,env(safe-area-inset-right,0px))] pb-[calc(40px+env(safe-area-inset-bottom,0px))] pl-5"
    >
      {mode === "brand" ? <BrandPanel /> : <SlideFields />}
    </aside>
  );
}
