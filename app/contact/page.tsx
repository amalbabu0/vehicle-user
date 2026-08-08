import type { Metadata } from "next";
import { Mail, Phone } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { createPublicClient } from "@/lib/supabase/public-client";
import { buildPageOg } from "@/lib/seo/page-metadata";

const description = "Get in touch with Kerala Lease Hub for questions about listings, leasing, or your account.";

export const metadata: Metadata = {
  title: "Contact",
  description,
  alternates: { canonical: "/contact" },
  ...buildPageOg({ title: "Contact", description, path: "/contact" }),
};

export default async function ContactPage() {
  const supabase = createPublicClient();
  const { data } = await supabase.from("site_settings").select("value").eq("key", "contact_info").maybeSingle();
  const contact = (data?.value as { email?: string; phone?: string; whatsapp?: string }) ?? {};
  const hasContact = Boolean(contact.email || contact.phone || contact.whatsapp);

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold">Contact us</h1>
        {hasContact ? (
          <ul className="mt-6 space-y-3 text-sm">
            {contact.email ? (
              <li>
                <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-2 no-underline hover:underline">
                  <Mail className="size-4" /> {contact.email}
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
          </ul>
        ) : (
          <p className="mt-6 text-sm text-muted-foreground">
            Contact details will be published here shortly. For vehicle enquiries, contact the owner directly from the
            listing page.
          </p>
        )}
      </main>
      <Footer />
    </>
  );
}
