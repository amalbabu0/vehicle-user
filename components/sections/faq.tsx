import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const FAQS = [
  {
    question: "How do I buy a vehicle?",
    answer:
      "Browse or search for a vehicle, open its listing page, and contact the owner directly by phone or WhatsApp. Kerala Lease Hub connects you with the owner — the sale or lease itself happens directly between you and them.",
  },
  {
    question: "How do I list my vehicle?",
    answer:
      "Visit the Sell Your Vehicle page and reach out with your vehicle's details and photos. Listings are created and reviewed before going live.",
  },
  {
    question: "Is registration free?",
    answer: "Yes — creating an account with email/password or Google is free.",
  },
  {
    question: "How do I contact the seller?",
    answer: "Every vehicle listing shows a Call and WhatsApp button that connects you directly with the owner.",
  },
  {
    question: "Is Google Login required?",
    answer: "No — you can sign in with either email/password or your Google account.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h2 className="text-center text-2xl font-semibold sm:text-3xl">Frequently asked questions</h2>
      <Accordion type="single" collapsible className="mt-6">
        {FAQS.map((faq) => (
          <AccordionItem key={faq.question} value={faq.question}>
            <AccordionTrigger>{faq.question}</AccordionTrigger>
            <AccordionContent>{faq.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
