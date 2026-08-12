import { Skeleton } from "@/components/ui/skeleton";

// Mirrors UserSettingsForm's collapsed default state: 3 sections (Profile —
// Name/Phone, Security — Change Password/Change Email, Account — Delete
// Account), each ExpandableCard collapsed to just its title+description
// row. No Navbar/Footer here — the real settings page doesn't render them
// either (this route sits outside that chrome by design).
function ExpandableCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-56" />
        </div>
        <Skeleton className="size-4 shrink-0 rounded" />
      </div>
    </div>
  );
}

export default function SettingsLoading() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>

      <div className="space-y-6">
        <section className="space-y-3">
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-3.5 w-64" />
          </div>
          <ExpandableCardSkeleton />
          <ExpandableCardSkeleton />
        </section>

        <section className="space-y-3">
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-3.5 w-56" />
          </div>
          <ExpandableCardSkeleton />
          <ExpandableCardSkeleton />
        </section>

        <section className="space-y-3">
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-3.5 w-48" />
          </div>
          <ExpandableCardSkeleton />
        </section>
      </div>
    </main>
  );
}
