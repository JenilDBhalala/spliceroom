import { useEffect, useState } from "react";
import { onImageLoaded } from "./images";

/** A counter that bumps whenever an image decodes or fonts finish loading. */
export function useRedrawTick() {
  const [tick, setTick] = useState(0);
  useEffect(() => onImageLoaded(() => setTick((t) => t + 1)), []);
  return tick;
}
