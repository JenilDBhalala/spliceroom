// Site-wide facts for metadata, the sitemap and structured data.
export const SITE_NAME = "Spliceroom";
export const SITE_TITLE = "Spliceroom: free meme, poster & Instagram post maker";
export const SITE_DESCRIPTION =
  "Make memes, movie posters, quote cards, tweet-style posts, carousels and stories for Instagram in seconds. Free templates, 20+ social media fonts, 4:5, 1:1 and 9:16 sizes. Works on your phone, nothing to install.";
export const SITE_KEYWORDS = [
  "meme maker",
  "meme generator",
  "movie poster maker",
  "instagram post maker",
  "instagram carousel maker",
  "instagram story maker",
  "quote card maker",
  "tweet image generator",
  "social media post templates",
  "free poster maker",
];

/**
 * Absolute site URL. Set NEXT_PUBLIC_SITE_URL for a custom domain; on Vercel the
 * production domain is used automatically.
 */
export const SITE_URL = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000"),
);

/** Google Analytics 4 measurement ID (public). Override with NEXT_PUBLIC_GA_ID; set it to "" to turn analytics off. */
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "G-6SMGJSW1FE";
