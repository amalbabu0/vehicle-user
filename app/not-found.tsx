import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";

// Next.js auto-injects a `noindex` <meta name="robots"> for any response
// with a 404 status. But this segment still inherits the root layout's
// `robots: {index:true}` (metadata merging doesn't touch fields a segment
// doesn't itself set), so without this override the page shipped two
// conflicting <meta name="robots"> tags. Google resolves that by taking
// the most restrictive directive, so it was harmless in practice — but an
// explicit override here is what's actually correct rather than relying
// on that resolution behavior.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
        <SearchX className="size-12 text-muted-foreground" aria-hidden="true" />
        <h1 className="mt-6 text-2xl font-semibold sm:text-3xl">Page not found</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist, or the listing may have been withdrawn or sold.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild>
            <Link href="/">Back to Home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/vehicles">Browse vehicles</Link>
          </Button>
        </div>
      </main>
      <Footer />
    </>
  );
}
