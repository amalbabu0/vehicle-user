import { getLatestVehicles } from "@/lib/data/vehicles";
import { VehicleGridSection } from "@/components/sections/vehicle-grid-section";

export async function LatestVehicles() {
  const vehicles = await getLatestVehicles(8);

  return (
    <VehicleGridSection
      id="latest"
      title="Recently added"
      subtitle="Freshly listed vehicles"
      vehicles={vehicles}
      viewAllHref="/vehicles?sort=latest"
    />
  );
}
