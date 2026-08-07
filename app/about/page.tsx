import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "About",
  description: "Kerala Lease Hub is a vehicle marketplace connecting buyers, sellers, and vehicle owners across Kerala.",
};

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold">About Kerala Lease Hub</h1>
        <div className="mt-6 space-y-4 text-sm leading-7 text-muted-foreground">
          <p>
            Kerala Lease Hub is a vehicle marketplace built for Kerala — a place to browse, buy, sell, and lease used
            cars and bikes directly from owners, without the noise of unrelated classifieds.
          </p>
          <p>
            Every listing goes through a lister before it&apos;s published, and vehicle details — brand, model, fuel
            type, transmission, location — are structured rather than free text, so what you see in search results
            matches what the seller actually listed.
          </p>
          <p>
            Contact between buyers and owners happens directly (phone or WhatsApp) — Kerala Lease Hub is the
            marketplace, not a middleman in the transaction.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
