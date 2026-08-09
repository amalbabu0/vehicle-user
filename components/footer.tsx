import Image from "next/image";
import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { createPublicClient } from "@/lib/supabase/public-client";

type ContactInfo = { email?: string; phone?: string; whatsapp?: string };

async function getContactInfo(): Promise<ContactInfo> {
  const supabase = createPublicClient();
  const { data } = await supabase.from("site_settings").select("value").eq("key", "contact_info").maybeSingle();
  return (data?.value as ContactInfo) ?? {};
}

const FOOTER_LINKS = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms" },
  { href: "/#faq", label: "FAQs" },
];

export async function Footer() {
  const contact = await getContactInfo();

  return (
    <footer className="mt-16 border-t border-border">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3">
          <div>
            <div className="relative h-11 w-40">
              <Image
                src="/branding/logo-footer.webp"
                alt="Kerala Lease Hub — lease used cars and bikes across Kerala"
                fill
                className="object-contain object-left dark:hidden"
              />
              <Image
                src="/branding/logo-footer-dark.avif"
                alt="Kerala Lease Hub — lease used cars and bikes across Kerala"
                fill
                className="hidden object-contain object-left dark:block"
              />
            </div>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Kerala&apos;s vehicle marketplace for buying, selling, and leasing used cars and bikes directly from owners.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold">Links</p>
            <ul className="mt-3 space-y-2">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground no-underline hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {(contact.email || contact.phone) && (
            <div>
              <p className="text-sm font-semibold">Contact</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {contact.email ? (
                  <li>
                    <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-2 no-underline hover:text-foreground">
                      <Mail className="size-4" /> {contact.email}
                    </a>
                  </li>
                ) : null}
                {contact.phone ? (
                  <li>
                    <a href={`tel:${contact.phone}`} className="inline-flex items-center gap-2 no-underline hover:text-foreground">
                      <Phone className="size-4" /> {contact.phone}
                    </a>
                  </li>
                ) : null}
              </ul>
            </div>
          )}
        </div>

        <div className="mt-8 border-t border-border pt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Kerala Lease Hub. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
