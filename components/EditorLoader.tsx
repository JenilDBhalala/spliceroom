"use client";

import dynamic from "next/dynamic";
import { useState, type ReactNode } from "react";

// The editor draws on canvases and reads browser storage, so it renders only in the browser.
const Editor = dynamic(() => import("@/components/Editor"), { ssr: false });

/**
 * Shows `fallback` (server-rendered HTML: what search engines and slow connections see first)
 * until the editor has loaded and restored saved work.
 */
export default function EditorLoader({ fallback }: { fallback: ReactNode }) {
  const [ready, setReady] = useState(false);
  return (
    <>
      {!ready && fallback}
      <Editor onReady={() => setReady(true)} />
    </>
  );
}
