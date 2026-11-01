"use client";

import Link from "next/link";
import { openConsentSettings } from "@/lib/consent";

/** Privacy · Terms · Cookie settings, for the app's panels and page footers. */
export default function LegalLinks({ className = "" }: { className?: string }) {
  const link = "text-muted underline-offset-2 hover:text-fg hover:underline";
  return (
    <nav aria-label="Legal" className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-xs ${className}`}>
      <Link href="/privacy" className={link}>
        Privacy
      </Link>
      <span aria-hidden className="text-line">
        ·
      </span>
      <Link href="/terms" className={link}>
        Terms
      </Link>
      <span aria-hidden className="text-line">
        ·
      </span>
      <button type="button" onClick={openConsentSettings} className={`cursor-pointer ${link}`}>
        Cookie settings
      </button>
    </nav>
  );
}
