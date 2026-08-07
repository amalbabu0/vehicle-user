// Mirrors admin/lib/validators/vehicle.ts's FUEL_TYPES/TRANSMISSIONS —
// duplicated intentionally (two fully independent apps, no shared package).
// Keep these two lists in sync if the admin app's options ever change.
export const FUEL_TYPES = ["Petrol", "Diesel", "CNG", "LPG", "Electric", "Hybrid", "Hydrogen"] as const;

export const TRANSMISSIONS = [
  "Manual", "Automatic (AT)", "AMT", "CVT", "DCT", "iMT", "Tiptronic", "Sequential", "Semi-Automatic",
] as const;
