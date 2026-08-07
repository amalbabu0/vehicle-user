import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms and conditions for using Kerala Lease Hub's vehicle marketplace.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold">Terms of Use</h1>
        <div className="mt-6 space-y-4 text-sm leading-7 text-muted-foreground">
          <p>
            This page describes, factually, how Kerala Lease Hub works. It is not a substitute for legal advice —
            have it reviewed before relying on it as a binding agreement.
          </p>
          <h2 className="text-base font-semibold text-foreground">What Kerala Lease Hub is</h2>
          <p>
            Kerala Lease Hub is a listings marketplace. Vehicle listings are created by owners or their listers, not
            by Kerala Lease Hub — we don&apos;t own, inspect, or guarantee the condition of any vehicle listed here.
          </p>
          <h2 className="text-base font-semibold text-foreground">Transactions</h2>
          <p>
            Any purchase, sale, or lease arranged through a listing is a direct agreement between the buyer and the
            seller. Verify a vehicle&apos;s condition, documents, and ownership yourself before making a payment.
          </p>
          <h2 className="text-base font-semibold text-foreground">Accounts</h2>
          <p>Registered users are responsible for keeping their account credentials secure.</p>
        </div>
      </main>
      <Footer />
    </>
  );
}
