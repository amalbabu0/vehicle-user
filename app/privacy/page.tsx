import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold">Privacy Policy</h1>
        <div className="mt-6 space-y-4 text-sm leading-7 text-muted-foreground">
          <p>
            This page describes, factually, what Kerala Lease Hub collects and how it&apos;s used. It is not a
            substitute for legal advice — have it reviewed before relying on it as a binding policy.
          </p>
          <h2 className="text-base font-semibold text-foreground">What we collect</h2>
          <p>
            When you create an account, we store your name, email address, and (if you sign in with Google) the
            profile info Google shares with us. If you contact a seller or save a favorite, that action is tied to
            your account.
          </p>
          <h2 className="text-base font-semibold text-foreground">What we don&apos;t do</h2>
          <p>
            We don&apos;t sell your data to third parties. Vehicle contact numbers are shown on listing pages so
            buyers can reach sellers directly — that contact happens between you and the seller, not through us.
          </p>
          <h2 className="text-base font-semibold text-foreground">Cookies</h2>
          <p>This site uses cookies only to keep you signed in and to remember your theme preference.</p>
        </div>
      </main>
      <Footer />
    </>
  );
}
