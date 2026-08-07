import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getFavoritesCursorPage } from "@/lib/data/favorites";
import { InfiniteVehicleGrid } from "@/components/infinite-vehicle-grid";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Your Favorites", robots: { index: false, follow: false } };

const PAGE_SIZE = 20;

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

  // Cursor-paginated (see PERFORMANCE.md #4) via infinite scroll, same
  // pattern as the main search results — a favorites list has no natural
  // cap for an active user.
  const { vehicles, nextCursor, total } = await getFavoritesCursorPage(user.id, PAGE_SIZE, null);
  const vehiclesWithFavorite = vehicles.map((vehicle) => ({ ...vehicle, favorited: true }));

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
            <div className="mt-6">
              <InfiniteVehicleGrid
                initialVehicles={vehiclesWithFavorite}
                initialCursor={nextCursor}
                filtersQueryString=""
                fetchUrl="/api/favorites/list"
              />
            </div>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
