import { getFeaturedVehicles } from "@/lib/data/home";
import { VehicleGridSection } from "@/components/sections/vehicle-grid-section";

export async function FeaturedVehicles() {
  const vehicles = await getFeaturedVehicles(8);

  return (
    <VehicleGridSection
      title="Featured vehicles"
      subtitle="Hand-picked and most-viewed listings"
      vehicles={vehicles}
      viewAllHref="/vehicles"
    />
  );
}
