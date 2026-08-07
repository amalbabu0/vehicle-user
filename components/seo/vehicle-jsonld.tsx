import { env } from "@/lib/env";
import type { VehicleCardData } from "@/lib/types/vehicle-card";

export function VehicleJsonLd({ vehicle }: { vehicle: VehicleCardData }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    name: vehicle.name,
    brand: vehicle.brandName ?? undefined,
    model: vehicle.model ?? undefined,
    vehicleModelDate: vehicle.registrationYear ?? undefined,
    fuelType: vehicle.fuelType ?? undefined,
    vehicleTransmission: vehicle.transmission ?? undefined,
    mileageFromOdometer: vehicle.kmDriven
      ? { "@type": "QuantitativeValue", value: vehicle.kmDriven, unitCode: "KMT" }
      : undefined,
    image: vehicle.coverImageUrl ?? undefined,
    url: `${env.SITE_URL}/vehicles/${vehicle.slug}`,
    offers: {
      "@type": "Offer",
      price: vehicle.leaseAmount,
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      url: `${env.SITE_URL}/vehicles/${vehicle.slug}`,
    },
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
