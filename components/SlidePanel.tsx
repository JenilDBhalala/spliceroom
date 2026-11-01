import type { Posts, SlideKind, StyledKey } from "@/types/post";
import { useEditor, useSlides } from "@/lib/store";
import { templateInfo } from "@/lib/templates";
import BrandPanel from "./panels/BrandPanel";
import ComparePanel from "./panels/ComparePanel";
import CustomPanel from "./panels/CustomPanel";
import FollowPanel from "./panels/FollowPanel";
import HeadlinePanel from "./panels/HeadlinePanel";
import LessonsPanel from "./panels/LessonsPanel";
import ListPanel from "./panels/ListPanel";
import MemePanel from "./panels/MemePanel";
import NewsPanel from "./panels/NewsPanel";
import PosterPanel from "./panels/PosterPanel";
import QuotePanel from "./panels/QuotePanel";
import StyleSection from "./panels/StyleSection";
import TimelinePanel from "./panels/TimelinePanel";
import TweetPanel from "./panels/TweetPanel";
import { PanelHeader, SlideCount } from "./panels/ui";

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
};

/** Slides where the text style only reaches the cover, so the section says so. */
const STYLE_NOTES: Partial<Record<SlideKind, string>> = {
  hlClean: "Applies to the headline on the cover.",
  listItem: "Applies to the cover headline and highlight color. Each movie picks its own title font above.",
  newsStory: "Applies to the cover headline and highlight color.",
  timeline: "Applies to the movie titles.",
  tweet: "Applies to the post text.",
};

/** Fields for the selected slide only (or brand settings). */
export default function SlidePanel() {
  const mode = useEditor((s) => s.mode);
  const fmt = useEditor((s) => s.fmt);
  const resetTemplate = useEditor((s) => s.resetTemplate);
  const { slides, sel } = useSlides();
  const slide = slides[sel];

  let body;
  if (mode === "brand") body = <BrandPanel />;
  else {
    const k = slide.kind;
    // The blank canvas styles each text layer on its own, so it has no shared text style.
    const styleKey: StyledKey | null = k === "follow" ? "follow" : fmt === "custom" ? null : (fmt as StyledKey);
    body = (
      <>
        <PanelHeader title={TITLES[k]}>{slides.length > 1 && <SlideCount sel={sel} total={slides.length} />}</PanelHeader>
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
        {k === "custom" && <CustomPanel />}
        {styleKey && <StyleSection key={styleKey} postKey={styleKey} note={STYLE_NOTES[k]} />}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <span className="flex items-center gap-2 text-xs text-muted">
            <i aria-hidden className="inline-block size-2 rounded-full bg-accent" />
            Changes are saved on this device
          </span>
          <button
            type="button"
            className="btn btn-small btn-ghost btn-danger"
            onClick={() => {
              const name = templateInfo(fmt).name;
              if (confirm(`Start "${name}" over? Your text, photos and style for this template will be replaced with the sample.`)) resetTemplate(fmt as keyof Posts);
            }}
          >
            Start over
          </button>
        </div>
      </>
    );
  }

  return (
    <aside
      aria-live="polite"
      className="flex min-w-0 flex-col gap-[18px] bg-panel px-4 pt-5 pb-[calc(40px+env(safe-area-inset-bottom,0px))] max-md:border-t max-md:border-line md:overflow-auto md:border-l md:border-line md:pr-[max(20px,env(safe-area-inset-right,0px))] md:pl-5"
    >
      {body}
    </aside>
  );
}
