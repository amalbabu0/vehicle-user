import { getFeaturedVehicles } from "@/lib/data/home";
import { getFavoriteVehicleIds } from "@/lib/data/favorites";
import { VehicleGridSection } from "@/components/sections/vehicle-grid-section";

export async function FeaturedVehicles() {
  const [vehicles, favoritedIds] = await Promise.all([getFeaturedVehicles(8), getFavoriteVehicleIds()]);

  return (
    <VehicleGridSection
      title="Featured vehicles"
      subtitle="Hand-picked and most-viewed listings"
      vehicles={vehicles}
      favoritedIds={favoritedIds}
      viewAllHref="/vehicles"
    />
  );
}
