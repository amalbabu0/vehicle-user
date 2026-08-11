import Image from "next/image";
import Link from "next/link";
import { Mail, Phone, MessageCircle, ShieldCheck, PhoneCall, ReceiptText } from "lucide-react";
import { createPublicClient } from "@/lib/supabase/public-client";
import { FacebookIcon, InstagramIcon, WhatsappIcon } from "@/components/icons/social-icons";

type ContactInfo = { email?: string; phone?: string; whatsapp?: string };
// Same site_settings row the admin app's Settings → Social tab writes
// (lib/admin/settings-data.ts's SocialLinks) — read-only here.
type SocialLinks = { facebook?: string; instagram?: string };

async function getContactInfo(): Promise<ContactInfo> {
  const supabase = createPublicClient();
  const { data } = await supabase.from("site_settings").select("value").eq("key", "contact_info").maybeSingle();
  return (data?.value as ContactInfo) ?? {};
}

async function getSocialLinks(): Promise<SocialLinks> {
  const supabase = createPublicClient();
  const { data } = await supabase.from("site_settings").select("value").eq("key", "social_links").maybeSingle();
  return (data?.value as SocialLinks) ?? {};
}

const FOOTER_LINKS = [
  { href: "/vehicles", label: "Browse Vehicles" },
  { href: "/sell", label: "List Your Vehicle" },
  { href: "/about", label: "About" },
  { href: "/#faq", label: "FAQs" },
  { href: "/contact", label: "Contact" },
];

const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms" },
];

const TRUST_BADGES = [
  { icon: ShieldCheck, label: "Verified listings" },
  { icon: PhoneCall, label: "Direct owner contact" },
  { icon: ReceiptText, label: "No hidden charges" },
];

export async function Footer() {
  const [contact, social] = await Promise.all([getContactInfo(), getSocialLinks()]);
  const hasContact = Boolean(contact.email || contact.phone || contact.whatsapp);

  const socialLinks = [
    contact.whatsapp
      ? { href: `https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`, label: "WhatsApp", Icon: WhatsappIcon }
      : null,
    social.facebook ? { href: social.facebook, label: "Facebook", Icon: FacebookIcon } : null,
    social.instagram ? { href: social.instagram, label: "Instagram", Icon: InstagramIcon } : null,
  ].filter((link): link is { href: string; label: string; Icon: typeof WhatsappIcon } => link !== null);

  return (
    <footer className="mt-16 border-t border-border bg-muted/30">
      {/* A thin brand-color accent caps the page content before the footer
          takes over — the same radial-gradient motif the hero opens with,
          bookending the page instead of an abrupt flat border. */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-[1.3fr_1fr_1fr]">
          <div className="col-span-2 sm:col-span-1">
            <div className="relative h-11 w-40">
              <Image
                src="/branding/logo-footer.webp"
                alt="Kerala Lease Hub — lease cars, bikes, and every kind of vehicle across Kerala"
                fill
                className="object-contain object-left dark:hidden"
              />
              <Image
                src="/branding/logo-footer-dark.avif"
                alt="Kerala Lease Hub — lease cars, bikes, and every kind of vehicle across Kerala"
                fill
                className="hidden object-contain object-left dark:block"
              />
            </div>
            <p className="mt-3 max-w-xs text-sm leading-6 text-muted-foreground">
              Kerala&apos;s dedicated vehicle leasing platform — lease cars, bikes, and every kind of vehicle directly
              from owners.
            </p>
            <ul className="mt-5 space-y-2.5">
              {TRUST_BADGES.map((badge) => (
                <li key={badge.label} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <badge.icon className="size-3.5 shrink-0 text-primary" />
                  {badge.label}
                </li>
              ))}
            </ul>

            {socialLinks.length > 0 ? (
              <ul className="mt-5 flex items-center gap-3">
                {socialLinks.map(({ href, label, Icon }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground no-underline transition hover:border-primary/50 hover:text-primary"
                    >
                      <Icon className="size-4" />
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className={hasContact ? undefined : "col-span-2 sm:col-span-1"}>
            <p className="text-xs font-semibold tracking-wide text-foreground/80 uppercase">Links</p>
            <ul className={hasContact ? "mt-4 space-y-2.5" : "mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 sm:block sm:space-y-2.5"}>
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground no-underline hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {hasContact ? (
            <div>
              <p className="text-xs font-semibold tracking-wide text-foreground/80 uppercase">Contact</p>
              <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
                {contact.whatsapp ? (
                  <li>
                    <a
                      href={`https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 no-underline hover:text-foreground"
                    >
                      <MessageCircle className="size-4 shrink-0 text-emerald-600" /> WhatsApp
                    </a>
                  </li>
                ) : null}
                {contact.phone ? (
                  <li>
                    <a href={`tel:${contact.phone}`} className="inline-flex items-center gap-2 no-underline hover:text-foreground">
                      <Phone className="size-4 shrink-0" /> {contact.phone}
                    </a>
                  </li>
                ) : null}
                {contact.email ? (
                  <li>
                    <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-2 break-all no-underline hover:text-foreground">
                      <Mail className="size-4 shrink-0" /> {contact.email}
                    </a>
                  </li>
                ) : null}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Kerala Lease Hub. All rights reserved.</p>
          <ul className="flex items-center gap-4">
            {LEGAL_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="no-underline hover:text-foreground">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
