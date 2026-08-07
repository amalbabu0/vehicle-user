import { getDistricts } from "@/lib/data/locations";
import { getCategoriesWithCounts } from "@/lib/data/home";
import { HeroContent } from "@/components/hero-content";

export async function Hero() {
  const [districts, categories] = await Promise.all([getDistricts(), getCategoriesWithCounts()]);
  return <HeroContent districts={districts} categories={categories} />;
}
