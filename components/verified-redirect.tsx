"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const REDIRECT_SECONDS = 5;

export function VerifiedRedirect() {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_SECONDS);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((current) => current - 1);
    }, 1000);
    const timeout = setTimeout(() => router.replace("/"), REDIRECT_SECONDS * 1000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [router]);

  return (
    <p className="text-muted-foreground mt-1 text-sm" aria-live="polite">
      Redirecting to homepage in {Math.max(secondsLeft, 0)} second{secondsLeft === 1 ? "" : "s"}…
    </p>
  );
}
