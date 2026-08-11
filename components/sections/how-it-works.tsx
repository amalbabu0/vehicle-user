import { Search, MessageCircle, Handshake } from "lucide-react";

// Mirrors the actual mechanics described in Faq's "How do I lease a
// vehicle" answer — browse, contact the owner directly, agree the lease
// with them. No paperwork/payment step: there is no in-app payment or
// contract flow (see ARCHITECTURE.md), so this doesn't imply one exists.
const STEPS = [
  {
    icon: Search,
    title: "1. Browse",
    description: "Search cars, bikes, and every kind of vehicle available for lease across Kerala — filter by brand, price, fuel type, or district.",
  },
  {
    icon: MessageCircle,
    title: "2. Connect",
    description: "Call or WhatsApp the owner directly from the listing — no middleman, no waiting on a callback.",
  },
  {
    icon: Handshake,
    title: "3. Lease",
    description: "Agree the lease terms directly with the owner and drive away — the lease amount and period are set upfront, no hidden charges.",
  },
];

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h2 className="text-center text-2xl font-semibold sm:text-3xl">How it works</h2>
      <div className="mt-8 grid gap-8 sm:grid-cols-3">
        {STEPS.map((step) => (
          <div key={step.title} className="flex flex-col items-center text-center">
            <span className="flex size-16 items-center justify-center rounded-2xl border border-border bg-muted/30">
              <step.icon className="size-7 text-primary" />
            </span>
            <h3 className="mt-5 font-semibold">{step.title}</h3>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
