"use client";

import { useLayoutEffect, useState } from "react";
import Image from "next/image";

const STORAGE_KEY = "klh:splash-seen";
// How long the splash stays fully visible before starting its fade-out, and
// how long that fade takes — kept in sync with the CSS transition duration
// below so the overlay is only unmounted once it's actually invisible.
const VISIBLE_MS = 900;
const FADE_MS = 400;

/** Shown once per browser, the very first time someone opens the site with
 * no prior visit recorded — a returning visitor (the localStorage flag is
 * set, regardless of whether they're signed in) never sees it again.
 * localStorage rather than sessionStorage on purpose: "first time" means
 * ever, not "first tab this browser session."
 *
 * Uses useLayoutEffect (not useEffect) so the decision to show or skip is
 * made — and the DOM updated — before the browser paints the first frame,
 * avoiding a flash of the real page behind the overlay on a first visit.
 * Both the "should I show at all" state and this effect start at their
 * skip-safe defaults, so server-rendered HTML and the client's first
 * render always agree (no hydration mismatch) even though the real
 * decision can only be made client-side. */
export function SplashScreen() {
  const [phase, setPhase] = useState<"hidden" | "visible" | "leaving">("hidden");

  useLayoutEffect(() => {
    let seen: string | null = null;
    try {
      seen = localStorage.getItem(STORAGE_KEY);
    } catch {
      // Storage blocked (private mode, disabled cookies, etc.) — treat as
      // "already seen" rather than showing the splash on every load.
      return;
    }
    if (seen) return;

    setPhase("visible");
    const leaveTimer = setTimeout(() => setPhase("leaving"), VISIBLE_MS);
    const removeTimer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, "1");
      } catch {
        // Nothing to do — worst case the splash shows again next visit.
      }
      setPhase("hidden");
    }, VISIBLE_MS + FADE_MS);

    return () => {
      clearTimeout(leaveTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  useLayoutEffect(() => {
    if (phase === "hidden") return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [phase]);

  if (phase === "hidden") return null;

  return (
    <div
      role="presentation"
      aria-hidden="true"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-background transition-opacity ease-out"
      style={{ transitionDuration: `${FADE_MS}ms`, opacity: phase === "leaving" ? 0 : 1 }}
    >
      <div className="flex flex-col items-center gap-4">
        <Image
          src="/branding/KLB_white.webp"
          alt="Kerala Lease Hub"
          width={160}
          height={87}
          className="h-20 w-auto object-contain dark:hidden"
          priority
        />
        <Image
          src="/branding/KLB_black.webp"
          alt="Kerala Lease Hub"
          width={160}
          height={87}
          className="hidden h-20 w-auto object-contain dark:block"
          priority
        />
        <span className="size-6 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
      </div>
    </div>
  );
}
