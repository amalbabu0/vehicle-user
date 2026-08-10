import { createPublicClient } from "@/lib/supabase/public-client";

export type CategoryWithCount = { id: string; name: string; slug: string; count: number };

export async function getCategoriesWithCounts(): Promise<CategoryWithCount[]> {
  const supabase = createPublicClient();
  // Counts come from a Postgres GROUP BY (get_category_vehicle_counts), not
  // by fetching every published vehicle row and counting in JS — that
  // doesn't scale as the vehicles table grows, and the Supabase JS client
  // has no GROUP BY of its own.
  const [{ data: categories }, { data: counts }] = await Promise.all([
    supabase.from("categories").select("id, name, slug").order("name"),
    supabase.rpc("get_category_vehicle_counts"),
  ]);

  const countByCategory = new Map((counts ?? []).map((row) => [row.category_id, row.vehicle_count]));

  return (categories ?? []).map((category) => ({
    ...category,
    count: Number(countByCategory.get(category.id) ?? 0),
  }));
}

export type Testimonial = { name: string; location: string; quote: string; rating: number };

/**
 * Admin-editable via site_settings (key: homepage_testimonials, a JSON
 * array) — no seed data exists yet, so this returns [] until an admin adds
 * real customer testimonials. The component hides itself when empty rather
 * than showing placeholder quotes.
 */
export async function getTestimonials(): Promise<Testimonial[]> {
  const supabase = createPublicClient();
  const { data } = await supabase.from("site_settings").select("value").eq("key", "homepage_testimonials").maybeSingle();
  return Array.isArray(data?.value) ? (data.value as Testimonial[]) : [];
}
