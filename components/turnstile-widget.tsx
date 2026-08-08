"use client";

import Script from "next/script";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { usePublicConfig } from "@/lib/config/use-public-config";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          action: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export type TurnstileWidgetHandle = {
  /** Tokens are single-use — call this after a failed submit before retrying. */
  reset: () => void;
};

/**
 * Cloudflare Turnstile widget. Only proves a challenge was rendered — the
 * token still has to be verified server-side (lib/turnstile.ts) before the
 * gated action runs. See .claude/skills/turnstile-spin.
 */
export const TurnstileWidget = forwardRef<
  TurnstileWidgetHandle,
  { action: string; onVerify: (token: string) => void }
>(function TurnstileWidget({ action, onVerify }, ref) {
  const { data: config } = usePublicConfig();
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  // Lazy initial value (not a post-mount effect) so a page reached via
  // client-side navigation — where the script tag from a previous page is
  // already sitting in the DOM — doesn't wait on an onLoad that will
  // never fire again for an already-loaded script.
  const [scriptLoaded, setScriptLoaded] = useState(() => typeof window !== "undefined" && Boolean(window.turnstile));

  useImperativeHandle(ref, () => ({
    reset: () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
      }
    },
  }));

  // Covers the gap between that initial check and the script actually
  // finishing (fresh load on this page, or still mid-load from a
  // previous page's <Script> tag) — polls rather than relying solely on
  // the onLoad callback below.
  useEffect(() => {
    if (scriptLoaded) return;
    const interval = setInterval(() => {
      if (window.turnstile) {
        setScriptLoaded(true);
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [scriptLoaded]);

  useEffect(() => {
    if (!scriptLoaded || !config || !containerRef.current || !window.turnstile) return;
    if (widgetIdRef.current) return; // already rendered

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: config.turnstileSiteKey,
      action,
      callback: onVerify,
      "expired-callback": () => {
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.reset(widgetIdRef.current);
        }
      },
    });

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptLoaded, config, action]);

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        async
        defer
        onLoad={() => setScriptLoaded(true)}
      />
      <div ref={containerRef} />
    </>
  );
});
