"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CONSENT_EVENT, getConsent, setConsent, type Consent } from "@/lib/consent";

/**
 * Asks once whether analytics may run; "Cookie settings" links re-open it.
 * Sits above the phone tab bar, bottom-left on larger screens.
 */
export default function ConsentBanner() {
  const [open, setOpen] = useState(false);
  // In the editor, phones have a tab bar at the bottom to stay clear of.
  const inEditor = usePathname() === "/";

  useEffect(() => {
    // Read after mount: localStorage isn't available during server rendering.
    const t = setTimeout(() => setOpen(getConsent() === null), 0);
    const reopen = () => setOpen(true);
    addEventListener(CONSENT_EVENT, reopen);
    return () => {
      clearTimeout(t);
      removeEventListener(CONSENT_EVENT, reopen);
    };
  }, []);

  if (!open) return null;
  const choose = (v: Consent) => {
    setConsent(v);
    setOpen(false);
  };
  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className={`fixed inset-x-3 ${inEditor ? "bottom-[calc(72px+env(safe-area-inset-bottom,0px))]" : "bottom-[calc(12px+env(safe-area-inset-bottom,0px))]"} z-40 flex flex-col gap-3 rounded-2xl border border-line bg-panel p-4 shadow-[0_12px_40px_rgba(0,0,0,.55)] md:inset-x-auto md:bottom-5 md:left-5 md:max-w-sm`}
    >
      <p className="m-0 text-sm leading-relaxed">
        We use Google Analytics cookies to see which templates people use, so we can improve Spliceroom. Your photos and text never leave your
        device.{" "}
        <Link href="/privacy" className="font-semibold text-accent underline-offset-2 hover:underline">
          Privacy Policy
        </Link>
      </p>
      <div className="flex gap-2">
        <button type="button" className="btn min-h-10 flex-1 justify-center" onClick={() => choose("denied")}>
          Decline
        </button>
        <button type="button" className="btn btn-primary min-h-10 flex-1 justify-center" onClick={() => choose("granted")}>
          Accept
        </button>
      </div>
    </div>
  );
}
