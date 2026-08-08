"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function ShareButton({
  slug,
  name,
  className,
}: {
  slug: string;
  name: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const share = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const url = `${window.location.origin}/vehicles/${slug}`;

    // Web Share API first (native share sheet — mobile browsers mainly);
    // a user cancelling the sheet also rejects the promise, so only fall
    // back to clipboard on an actual failure, not every non-share path.
    if (navigator.share) {
      try {
        await navigator.share({ title: name, url });
        return;
      } catch {
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy link");
    }
  };

  return (
    <button
      type="button"
      onClick={share}
      aria-label="Share this listing"
      className={cn(
        "glass-surface flex size-9 items-center justify-center rounded-full text-foreground transition hover:scale-105",
        className
      )}
    >
      {copied ? <Check className="size-4 text-emerald-600" /> : <Share2 className="size-4" />}
    </button>
  );
}
