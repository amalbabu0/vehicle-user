import type { Metadata } from "next";
import { Mail, Phone } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { createPublicClient } from "@/lib/supabase/public-client";
import { buildPageOg } from "@/lib/seo/page-metadata";

const description = "List your car or bike for sale or lease on Kerala Lease Hub.";

export const metadata: Metadata = {
  title: "Sell Your Vehicle",
  description,
  alternates: { canonical: "/sell" },
  ...buildPageOg({ title: "Sell Your Vehicle", description, path: "/sell" }),
};

export default async function SellPage() {
  const supabase = createPublicClient();
  const { data } = await supabase.from("site_settings").select("value").eq("key", "contact_info").maybeSingle();
  const contact = (data?.value as { email?: string; phone?: string; whatsapp?: string }) ?? {};
  const hasContact = Boolean(contact.email || contact.phone || contact.whatsapp);

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold">Sell your vehicle</h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          Listings on Kerala Lease Hub are created by our team so every vehicle is checked and structured
          consistently before it goes live. To get your car or bike listed, reach out with the details and photos:
        </p>
        {hasContact ? (
          <ul className="mt-6 space-y-3 text-sm">
            {contact.whatsapp ? (
              <li>
                <a
                  href={`https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 no-underline hover:underline"
                >
                  WhatsApp us: {contact.whatsapp}
                </a>
              </li>
            ) : null}
            {contact.phone ? (
              <li>
                <a href={`tel:${contact.phone}`} className="inline-flex items-center gap-2 no-underline hover:underline">
                  <Phone className="size-4" /> {contact.phone}
                </a>
              </li>
            ) : null}
            {contact.email ? (
              <li>
                <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-2 no-underline hover:underline">
                  <Mail className="size-4" /> {contact.email}
                </a>
              </li>
            ) : null}
          </ul>
        ) : (
          <p className="mt-6 text-sm text-muted-foreground">
            Contact details will be published here shortly.
          </p>
        )}
      </main>
      <Footer />
    </>
  );
}
