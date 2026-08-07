import { getLatestVehicles } from "@/lib/data/vehicles";
import { getFavoriteVehicleIds } from "@/lib/data/favorites";
import { VehicleGridSection } from "@/components/sections/vehicle-grid-section";

export async function LatestVehicles() {
  const [vehicles, favoritedIds] = await Promise.all([getLatestVehicles(8), getFavoriteVehicleIds()]);

  return (
    <VehicleGridSection
      id="latest"
      title="Recently added"
      subtitle="Freshly listed vehicles"
      vehicles={vehicles}
      favoritedIds={favoritedIds}
      viewAllHref="/vehicles?sort=latest"
    />
  );
}
