"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

// Below this length a 3-line clamp wouldn't actually hide anything, so the
// toggle would just be a button that does nothing when clicked.
const TRUNCATE_THRESHOLD = 220;

export function VehicleDescription({ description }: { description: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = description.length > TRUNCATE_THRESHOLD;

  return (
    <div>
      <p className={cn("whitespace-pre-line text-sm leading-6 text-muted-foreground", !expanded && isLong && "line-clamp-3")}>
        {description}
      </p>
      {isLong ? (
        <button type="button" onClick={() => setExpanded((value) => !value)} className="mt-2 text-sm font-medium text-primary hover:underline">
          {expanded ? "Read less" : "Read more"}
        </button>
      ) : null}
    </div>
  );
}
