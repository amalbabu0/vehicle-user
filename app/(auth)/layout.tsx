import type { Metadata } from "next";

// Applies to every page in this group (login, register, forgot-password,
// reset-password, verify-email) — none of them can export their own
// metadata since they're all client components. robots.txt already
// disallows these paths, but that only stops crawling, not indexing — a
// disallowed URL can still get indexed (with no snippet) if it's linked
// externally. This is the directive that actually guarantees it stays out.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
      <div className="relative w-full max-w-sm overflow-hidden rounded-xl border border-border bg-card p-8 shadow-2xl">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/25 to-transparent" />
        {children}
      </div>
    </main>
  );
}
