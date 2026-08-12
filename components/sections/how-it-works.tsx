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
      {/* Three across at every width, including phones. A 375px screen leaves
          roughly 106px per column, so the icon, headings and body all step
          down a size below `sm` and the gap tightens from 8 to 3 — at the
          desktop sizes the copy would be a very tall, very narrow ribbon. */}
      <div className="mt-8 grid grid-cols-3 gap-3 sm:gap-8">
        {STEPS.map((step) => (
          <div key={step.title} className="flex flex-col items-center text-center">
            <span className="flex size-11 items-center justify-center rounded-xl border border-border bg-muted/30 sm:size-16 sm:rounded-2xl">
              <step.icon className="size-5 text-primary sm:size-7" />
            </span>
            <h3 className="mt-3 text-sm font-semibold sm:mt-5 sm:text-base">{step.title}</h3>
            {/* max-w-xs only from sm: below that the column is already far
                narrower than 20rem, so the constraint does nothing. */}
            <p className="mt-1 text-xs leading-snug text-muted-foreground sm:mt-2 sm:max-w-xs sm:text-sm sm:leading-normal">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
