import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL.href, changeFrequency: "weekly", priority: 1 },
    { url: new URL("/privacy", SITE_URL).href, changeFrequency: "yearly", priority: 0.3 },
    { url: new URL("/terms", SITE_URL).href, changeFrequency: "yearly", priority: 0.3 },
  ];
}
