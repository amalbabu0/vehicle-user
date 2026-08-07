import { FAQS } from "@/components/sections/faq";

/** Derived from the same FAQS array the visible Faq section renders — the
 * schema and the on-page content can never drift apart, which Google's
 * structured-data guidelines require (the markup must match what's
 * actually visible on the page). */
export function FaqJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
