import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const FAQS = [
  {
    question: "How do I lease a vehicle in Kerala?",
    answer:
      "Browse or search for a car, bike, or any other vehicle, open its listing, and contact the owner directly by phone or WhatsApp to arrange the lease. Kerala Lease Hub connects you with the owner — the lease itself is agreed directly between you and them.",
  },
  {
    question: "What kinds of vehicles can I lease on Kerala Lease Hub?",
    answer:
      "Every kind — cars, bikes, scooters, and more. Kerala Lease Hub is a leasing-only platform, so every listing is available strictly on lease, never for sale. Filter by brand, fuel type, transmission, or district to narrow your search.",
  },
  {
    question: "Which districts in Kerala are covered?",
    answer:
      "Listings span every district and taluk in Kerala. Use the location filter on the Browse Vehicles page to see what's available for lease near you.",
  },
  {
    question: "How do I list my vehicle for lease?",
    answer:
      "Visit the List Your Vehicle page and reach out with your vehicle's details and photos. Every listing is reviewed before it goes live, so vehicles you see on the site are ready to lease.",
  },
  {
    question: "Are there hidden charges when leasing a vehicle?",
    answer:
      "No. The lease amount and lease period shown on a listing are set by the owner, and any service charge is displayed upfront on the listing — nothing is added later.",
  },
  {
    question: "How do I contact a vehicle owner?",
    answer: "Every listing shows Call and WhatsApp buttons that connect you directly with the owner — no middleman.",
  },
  {
    question: "Is registering on Kerala Lease Hub free?",
    answer: "Yes — creating an account with email/password or Google is free.",
  },
  {
    question: "Do I need a Google account to sign in?",
    answer: "No — you can sign in with either email/password or your Google account.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h2 className="text-center text-2xl font-semibold sm:text-3xl">Frequently asked questions about vehicle leasing in Kerala</h2>
      <Accordion type="single" collapsible className="mt-6 space-y-2">
        {FAQS.map((faq) => (
          <AccordionItem key={faq.question} value={faq.question} className="rounded-lg border border-border bg-muted/30 px-4 border-b-0">
            <AccordionTrigger>{faq.question}</AccordionTrigger>
            <AccordionContent>{faq.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
