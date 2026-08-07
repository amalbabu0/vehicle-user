import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getVehicleCardsByIds } from "@/lib/data/vehicles";
import { VehicleCard } from "@/components/vehicle-card";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Your Favorites", robots: { index: false, follow: false } };

export default async function FavoritesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold">Sign in to see your favorites</h1>
          <p className="mt-2 text-sm text-muted-foreground">Save vehicles you&apos;re interested in and find them here later.</p>
          <Link href="/login?redirectTo=/favorites" className="mt-6 inline-block no-underline">
            <Button>Sign in</Button>
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  const { data: favorites } = await supabase.from("favorites").select("vehicle_id").eq("user_id", user.id);
  const vehicles = await getVehicleCardsByIds((favorites ?? []).map((row) => row.vehicle_id));

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold">Your favorites</h1>
        {vehicles.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            You haven&apos;t saved any vehicles yet.{" "}
            <Link href="/vehicles" className="underline">
              Browse vehicles
            </Link>{" "}
            to get started.
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {vehicles.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} favorited />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
