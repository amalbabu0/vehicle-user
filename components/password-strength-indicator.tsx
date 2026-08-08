import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { calculatePasswordStrength } from "@/lib/password-strength";

const REQUIREMENT_LABELS: { key: "minLength" | "hasLetter" | "hasNumber" | "hasSpecialChar"; label: string }[] = [
  { key: "minLength", label: "At least 8 characters" },
  { key: "hasLetter", label: "Contains a letter" },
  { key: "hasNumber", label: "Contains a number" },
  { key: "hasSpecialChar", label: "Contains a special character" },
];

const LABEL_STYLES: Record<string, string> = {
  Weak: "text-destructive",
  Fair: "text-amber-600 dark:text-amber-500",
  Good: "text-blue-600 dark:text-blue-400",
  Strong: "text-emerald-600 dark:text-emerald-500",
};

const BAR_STYLES: Record<string, string> = {
  Weak: "bg-destructive",
  Fair: "bg-amber-500",
  Good: "bg-blue-500",
  Strong: "bg-emerald-500",
};

/** Shared by every User App password field (registration today; any future
 * change-password form should reuse this rather than recalculating
 * strength separately) — see lib/password-strength.ts for the scoring
 * logic itself. Nothing here ever leaves the browser: no network calls,
 * no storage, the password string is only ever read to compute booleans. */
export function PasswordStrengthIndicator({ password }: { password: string }) {
  if (!password) return null;

  const { label, score, requirements } = calculatePasswordStrength(password);
  const filledSegments = Math.max(1, Math.ceil((score / 6) * 4));

  return (
    <div className="space-y-2.5" aria-live="polite">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-1 gap-1" role="img" aria-label={`Password strength: ${label}`}>
          {[0, 1, 2, 3].map((segment) => (
            <div
              key={segment}
              className={cn(
                "h-1.5 flex-1 rounded-full bg-muted transition-colors",
                segment < filledSegments && BAR_STYLES[label]
              )}
            />
          ))}
        </div>
        <span className={cn("text-xs font-medium", LABEL_STYLES[label])}>{label}</span>
      </div>

      <ul className="space-y-1">
        {REQUIREMENT_LABELS.map(({ key, label: reqLabel }) => {
          const met = requirements[key];
          return (
            <li key={key} className={cn("flex items-center gap-1.5 text-xs", met ? "text-muted-foreground" : "text-muted-foreground/70")}>
              {met ? (
                <Check className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-500" aria-hidden="true" />
              ) : (
                <X className="size-3.5 shrink-0 text-muted-foreground/50" aria-hidden="true" />
              )}
              <span>
                {reqLabel}
                <span className="sr-only">{met ? " — met" : " — not met"}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
