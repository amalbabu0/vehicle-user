import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// vehicles.lease_period is free text (admin's Combobox allows a custom
// value alongside preset options like "6 months") — some listings ended up
// with just the bare number. Appends a unit only when one isn't already
// there, so "6" renders as "6 months" but "3-6 months"/"12" (custom text)
// are left alone.
export function formatLeasePeriod(leasePeriod: string): string {
  const trimmed = leasePeriod.trim();
  if (/month|year|week|day/i.test(trimmed)) return trimmed;
  if (/^\d+$/.test(trimmed)) return `${trimmed} month${trimmed === "1" ? "" : "s"}`;
  return trimmed;
}
