import type { Metadata, Viewport } from "next";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Spliceroom",
  description: "Make Instagram posts fast: memes, movie posters, tweets, quotes, lists and news, from templates.",
};

export const viewport: Viewport = {
  themeColor: "#0d0f0d",
  // Lets the layout pad around notches with env(safe-area-inset-*).
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fontVariables} h-full`}>
      <body className="h-full">{children}</body>
    </html>
  );
}
