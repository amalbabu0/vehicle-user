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
    question: "What documents do I need to lease a vehicle?",
    answer:
      "Requirements are set by the owner and confirmed directly with them — typically a valid driving license and ID proof. Ask the owner on the call or WhatsApp chat before finalizing.",
  },
  {
    question: "Can I lease a vehicle for a short period, like a few months?",
    answer:
      "Yes. Owners set their own lease period on each listing — anywhere from a few months to longer terms — so check the listing details or ask the owner directly for flexibility.",
  },
  {
    question: "Can I negotiate the lease amount with the owner?",
    answer:
      "Yes — the lease amount shown is set by the owner, and since you deal with them directly, you're free to discuss and negotiate terms before agreeing.",
  },
  {
    question: "How do I know a listing is genuine and not already leased?",
    answer:
      "Every listing is reviewed before it goes live, and verified owners carry a Verified badge. If a vehicle has already been leased, it's clearly marked \"Already Booked\" on its listing so you don't waste time contacting it.",
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
