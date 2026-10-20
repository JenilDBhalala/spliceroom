import type { SlideKind } from "@/types/post";
import { useEditor, useSlides } from "@/lib/store";
import BrandPanel from "./panels/BrandPanel";
import FollowPanel from "./panels/FollowPanel";
import HeadlinePanel from "./panels/HeadlinePanel";
import LessonsPanel from "./panels/LessonsPanel";
import ListPanel from "./panels/ListPanel";
import NewsPanel from "./panels/NewsPanel";
import TimelinePanel from "./panels/TimelinePanel";
import { PanelHeader, SlideCount } from "./panels/ui";

const TITLES: Record<SlideKind, string> = {
  hlCover: "Headline cover",
  hlClean: "Clean photo",
  listCover: "List cover",
  listItem: "Movie card",
  newsCover: "News cover",
  newsStory: "Story slide",
  lessonsCover: "Lessons cover",
  lessonItem: "Lesson",
  timeline: "Timeline",
  follow: "Follow card",
};

/** Right-hand fields for the selected slide only (or brand settings). */
export default function SlidePanel() {
  const mode = useEditor((s) => s.mode);
  const { slides, sel } = useSlides();
  const slide = slides[sel];

  let body;
  if (mode === "brand") body = <BrandPanel />;
  else {
    const k = slide.kind;
    body = (
      <>
        <PanelHeader title={TITLES[k]}>
          <SlideCount sel={sel} total={slides.length} />
        </PanelHeader>
        {(k === "hlCover" || k === "hlClean") && <HeadlinePanel slide={slide} />}
        {(k === "listCover" || k === "listItem") && <ListPanel slide={slide} />}
        {(k === "newsCover" || k === "newsStory") && <NewsPanel slide={slide} />}
        {(k === "lessonsCover" || k === "lessonItem") && <LessonsPanel slide={slide} />}
        {k === "timeline" && <TimelinePanel />}
        {k === "follow" && <FollowPanel />}
      </>
    );
  }

  return (
    <aside
      aria-live="polite"
      className="flex min-w-0 flex-col gap-[18px] overflow-auto border-l border-line bg-panel pt-5 pr-[max(20px,env(safe-area-inset-right,0px))] pb-10 pl-5 max-[900px]:border-t max-[900px]:border-l-0 max-[900px]:pr-[max(16px,env(safe-area-inset-right,0px))] max-[900px]:pl-[max(16px,env(safe-area-inset-left,0px))]"
    >
      {body}
    </aside>
  );
}
