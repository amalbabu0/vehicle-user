import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getVehicleCardsByIds } from "@/lib/data/vehicles";
import { VehicleCard } from "@/components/vehicle-card";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Your Favorites", robots: { index: false, follow: false } };

const PAGE_SIZE = 20;

type PageProps = { searchParams: Promise<{ page?: string }> };

export default async function FavoritesPage({ searchParams }: PageProps) {
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

  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam ?? 1));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // Favorites lists can grow large for an active user — paginate rather
  // than loading every saved vehicle at once.
  const { data: favorites, count } = await supabase
    .from("favorites")
    .select("vehicle_id", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(from, to);

  const vehicles = await getVehicleCardsByIds((favorites ?? []).map((row) => row.vehicle_id));
  const total = count ?? 0;
  const hasNextPage = from + (favorites?.length ?? 0) < total;

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
          <>
            <p className="mt-1 text-sm text-muted-foreground">{total.toLocaleString("en-IN")} saved vehicle{total === 1 ? "" : "s"}</p>
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {vehicles.map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} favorited />
              ))}
            </div>

            {(page > 1 || hasNextPage) && (
              <div className="mt-8 flex items-center justify-center gap-3">
                <Link
                  href={`/favorites?page=${Math.max(1, page - 1)}`}
                  aria-disabled={page <= 1}
                  className={`rounded-lg border border-border px-4 py-2 text-sm no-underline hover:bg-muted ${page <= 1 ? "pointer-events-none opacity-50" : ""}`}
                >
                  Previous
                </Link>
                <span className="text-sm text-muted-foreground">Page {page}</span>
                <Link
                  href={`/favorites?page=${page + 1}`}
                  aria-disabled={!hasNextPage}
                  className={`rounded-lg border border-border px-4 py-2 text-sm no-underline hover:bg-muted ${!hasNextPage ? "pointer-events-none opacity-50" : ""}`}
                >
                  Next
                </Link>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
