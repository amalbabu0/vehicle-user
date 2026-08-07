export type VehicleCardData = {
  id: string;
  slug: string;
  name: string;
  brandName: string | null;
  model: string | null;
  registrationYear: number | null;
  fuelType: string | null;
  transmission: string | null;
  kmDriven: number | null;
  leaseAmount: number;
  leasePeriod: string;
  districtName: string | null;
  locationName: string | null;
  coverImageUrl: string | null;
  viewCount: number;
  publishedAt: string | null;
  verified: boolean;
};
