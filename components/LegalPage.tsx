import Link from "next/link";
import type { ReactNode } from "react";
import { LEGAL_UPDATED, SITE_NAME } from "@/lib/site";
import LegalLinks from "./LegalLinks";
import LogoMark from "./LogoMark";

/** Readable single-column page for the Privacy Policy and Terms. */
export default function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-bg">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-5 pt-[max(14px,env(safe-area-inset-top,0px))] pb-3.5">
          <Link href="/" className="flex items-center gap-2 font-display text-2xl leading-none tracking-[.03em] uppercase">
            <LogoMark className="size-7" id="legal-logo" />
            {SITE_NAME}
          </Link>
          <Link href="/" className="btn btn-primary btn-small min-h-9">
            Open the editor
          </Link>
        </div>
      </header>
      <main className="legal mx-auto max-w-2xl px-5 pt-10 pb-16">
        <h1>{title}</h1>
        <p className="text-sm text-muted">Last updated: {LEGAL_UPDATED}</p>
        {children}
      </main>
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-3 px-5 pt-5 pb-[max(20px,env(safe-area-inset-bottom,0px))] text-xs text-muted">
          <span>
            © {LEGAL_UPDATED.slice(-4)} {SITE_NAME}
          </span>
          <LegalLinks />
        </div>
      </footer>
    </div>
  );
}
