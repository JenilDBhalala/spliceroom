import { useState } from "react";

/**
 * A news site's image shown straight from the site. When the browser refuses it (some sites block other sites from
 * showing their images), it loads through our own image route; when that's refused too, an empty box stays.
 */
export default function RemoteImg({ src, className }: { src: string; className?: string }) {
  const [tries, setTries] = useState(0);
  if (tries > 1) return <span aria-hidden className={`block bg-raise ${className ?? ""}`} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- remote news photos, shown as they are
    <img
      src={tries ? `/api/news/image?url=${encodeURIComponent(src)}` : src}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setTries(tries + 1)}
      className={className}
    />
  );
}
