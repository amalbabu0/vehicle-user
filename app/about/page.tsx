import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { buildPageOg } from "@/lib/seo/page-metadata";

const description = "Kerala Lease Hub is a dedicated vehicle leasing platform connecting lessees and vehicle owners across Kerala.";

export const metadata: Metadata = {
  title: "About",
  description,
  alternates: { canonical: "/about" },
  ...buildPageOg({ title: "About", description, path: "/about" }),
};

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold">About Kerala Lease Hub</h1>
        <div className="mt-6 space-y-4 text-sm leading-7 text-muted-foreground">
          <p>
            Kerala Lease Hub is a leasing platform built for Kerala — a place to browse and lease cars, bikes, and
            every kind of vehicle directly from owners, without the noise of unrelated classifieds.
          </p>
          <p>
            Every listing goes through a lister before it&apos;s published, and vehicle details — brand, model, fuel
            type, transmission, location — are structured rather than free text, so what you see in search results
            matches what the owner actually listed.
          </p>
          <p>
            Contact between lessees and owners happens directly (phone or WhatsApp) — Kerala Lease Hub is the
            leasing platform, not a middleman in the transaction.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
