"use client";

import dynamic from "next/dynamic";

// The editor draws on canvases and reads localStorage, so it only renders in the browser.
const Editor = dynamic(() => import("@/components/Editor"), { ssr: false });

export default function Page() {
  return <Editor />;
}
