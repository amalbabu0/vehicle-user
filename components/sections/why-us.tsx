import { ShieldCheck, Lock, PhoneCall, ReceiptText, Zap, Search, Smartphone, LogIn } from "lucide-react";

const FEATURES = [
  { icon: ShieldCheck, title: "Verified Listings", description: "Every listing is reviewed before it goes live." },
  { icon: Lock, title: "Secure Platform", description: "Built on Supabase with row-level security throughout." },
  { icon: PhoneCall, title: "Direct Owner Contact", description: "Call or WhatsApp the owner directly — no middleman." },
  { icon: ReceiptText, title: "No Hidden Charges", description: "The price you see is the price you discuss." },
  { icon: Zap, title: "Fast Listing Approval", description: "Listings go live quickly once reviewed." },
  { icon: Search, title: "Easy Search", description: "Filter by brand, price, fuel type, transmission, and district." },
  { icon: Smartphone, title: "Mobile Friendly", description: "Browse and list vehicles from any device." },
  { icon: LogIn, title: "Google Login", description: "Sign in instantly with your Google account." },
];

export function WhyUs() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h2 className="text-2xl font-semibold sm:text-3xl">Why Kerala Lease Hub</h2>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {FEATURES.map((feature) => (
          <div key={feature.title} className="glass-surface rounded-(--glass-radius-lg) p-5">
            <feature.icon className="size-6 text-primary" />
            <h3 className="mt-3 text-sm font-semibold">{feature.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
