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
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="glass-surface glass-specular w-full max-w-sm rounded-(--glass-radius-lg) p-8">
        {children}
      </div>
    </main>
  );
}
