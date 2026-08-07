import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Real, plain <a>-backed pagination — not just an infinite-scroll "load
 * more" button. Googlebot doesn't execute scroll/click interactions, so
 * without links like these, every /vehicles result past the first page is
 * invisible to it. baseSearchParams should carry the active filters
 * (everything except `page`) so navigating pages doesn't drop them. */
export function VehiclePagination({
  page,
  totalPages,
  baseSearchParams,
}: {
  page: number;
  totalPages: number;
  baseSearchParams: URLSearchParams;
}) {
  if (totalPages <= 1) return null;

  const hrefFor = (target: number) => {
    const params = new URLSearchParams(baseSearchParams);
    if (target <= 1) params.delete("page");
    else params.set("page", String(target));
    const qs = params.toString();
    return qs ? `/vehicles?${qs}` : "/vehicles";
  };

  // A window of page numbers around the current one, plus first/last —
  // keeps the link list short even when totalPages is large.
  const windowStart = Math.max(1, page - 2);
  const windowEnd = Math.min(totalPages, page + 2);
  const pageNumbers = Array.from({ length: windowEnd - windowStart + 1 }, (_, i) => windowStart + i);

  const linkClass = (active: boolean) =>
    cn(
      "flex min-h-11 min-w-11 items-center justify-center rounded-lg border px-3 text-sm font-medium no-underline",
      active ? "border-primary bg-primary text-primary-foreground" : "border-border text-foreground hover:bg-muted"
    );

  return (
    <nav aria-label="Vehicle listing pages" className="mt-8 flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} rel="prev" aria-label="Previous page" className={linkClass(false)}>
          <ChevronLeft className="size-4" />
        </Link>
      ) : null}

      {windowStart > 1 ? (
        <>
          <Link href={hrefFor(1)} className={linkClass(false)}>1</Link>
          {windowStart > 2 ? <span className="px-1 text-sm text-muted-foreground">…</span> : null}
        </>
      ) : null}

      {pageNumbers.map((n) => (
        <Link key={n} href={hrefFor(n)} aria-current={n === page ? "page" : undefined} className={linkClass(n === page)}>
          {n}
        </Link>
      ))}

      {windowEnd < totalPages ? (
        <>
          {windowEnd < totalPages - 1 ? <span className="px-1 text-sm text-muted-foreground">…</span> : null}
          <Link href={hrefFor(totalPages)} className={linkClass(false)}>{totalPages}</Link>
        </>
      ) : null}

      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} rel="next" aria-label="Next page" className={linkClass(false)}>
          <ChevronRight className="size-4" />
        </Link>
      ) : null}
    </nav>
  );
}
