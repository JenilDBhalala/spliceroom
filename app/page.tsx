import Link from "next/link";
import EditorLoader from "@/components/EditorLoader";
import LogoMark from "@/components/LogoMark";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import { TEMPLATE_GROUPS } from "@/lib/templates";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  url: SITE_URL.href,
  description: SITE_DESCRIPTION,
  applicationCategory: "DesignApplication",
  operatingSystem: "Any (web browser)",
  browserRequirements: "Requires JavaScript",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: TEMPLATE_GROUPS.flatMap((g) => g.templates.map((t) => `${t.name}: ${t.blurb}`)),
};

/** Server-rendered intro shown while the editor loads; it's also what crawlers index. */
function Intro() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center gap-6 px-6 py-16">
      <h1 className="m-0 flex items-center gap-3 font-display text-5xl tracking-[.03em] uppercase">
        <LogoMark className="size-10" id="intro-logo" />
        {SITE_NAME}
      </h1>
      <p className="m-0 text-lg">Free meme, movie poster and Instagram post maker.</p>
      <p className="m-0 text-muted">{SITE_DESCRIPTION}</p>
      <ul className="m-0 grid list-none gap-2 p-0 text-sm text-muted sm:grid-cols-2">
        {TEMPLATE_GROUPS.flatMap((g) => g.templates).map((t) => (
          <li key={t.id}>
            <strong className="text-fg">{t.name}</strong>: {t.blurb}
          </li>
        ))}
      </ul>
      <p className="m-0 text-sm text-muted">Loading the editor…</p>
      <nav aria-label="Legal" className="flex gap-4 text-xs text-muted">
        <Link href="/privacy" className="underline-offset-2 hover:underline">
          Privacy Policy
        </Link>
        <Link href="/terms" className="underline-offset-2 hover:underline">
          Terms of Use
        </Link>
      </nav>
    </main>
  );
}

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <EditorLoader fallback={<Intro />} />
    </>
  );
}
