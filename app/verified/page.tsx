import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { VerifiedRedirect } from "@/components/verified-redirect";

// Transient post-action page (only reachable right after clicking the
// confirm-signup email link) — nothing here is worth indexing.
export const metadata: Metadata = {
  title: "Account confirmed",
  robots: { index: false, follow: false },
};

export default function VerifiedPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
        <CheckCircle2 className="size-12 text-emerald-600" aria-hidden="true" />
        <h1 className="mt-6 text-2xl font-semibold sm:text-3xl">Your account is confirmed</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Your email has been verified. You&apos;re all set to browse and save listings.
        </p>
        <VerifiedRedirect />
        <div className="mt-6">
          <Button asChild>
            <Link href="/">Go to Home now</Link>
          </Button>
        </div>
      </main>
      <Footer />
    </>
  );
}
