import JSZip from "jszip";
import type { FormatId, RenderState, Slide } from "@/types/post";
import { H, W, renderSlide, slidesFor } from "@/lib/render";

const slideBlob = (state: RenderState, slide: Slide, scale: number) =>
  new Promise<Blob>((resolve, reject) => {
    const c = document.createElement("canvas");
    c.width = W * scale;
    c.height = H * scale;
    renderSlide(c.getContext("2d")!, state, slide, scale);
    c.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not encode PNG"))), "image/png");
  });

function saveBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** One slide downloads as a PNG; a carousel as a zip of 01-cover.png, 02-…. Size follows brand.exportScale. */
export async function downloadPost(state: RenderState, fmt: FormatId) {
  const slides = slidesFor(fmt, state.posts);
  const scale = state.brand.exportScale ?? 2;
  const stamp = new Date().toISOString().slice(0, 10);
  const base = `${(state.brand.name || "post").replace(/[^\w-]+/g, "")}-${fmt}-${stamp}`;
  if (slides.length === 1) {
    saveBlob(`${base}.png`, await slideBlob(state, slides[0], scale));
    return;
  }
  const zip = new JSZip();
  for (let i = 0; i < slides.length; i++) {
    const name = `${String(i + 1).padStart(2, "0")}-${slides[i].label.replace(/[^\w-]+/g, "-").toLowerCase()}.png`;
    zip.file(name, await slideBlob(state, slides[i], scale));
  }
  saveBlob(`${base}.zip`, await zip.generateAsync({ type: "blob" }));
}
