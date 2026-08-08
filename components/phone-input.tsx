"use client";

import { useId, useMemo, useState } from "react";
import { getCountries, getCountryCallingCode, type CountryCode } from "libphonenumber-js/min";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const DEFAULT_COUNTRY: CountryCode = "IN";

// Intl.DisplayNames is built into the JS runtime (browser and Node both) —
// no need to bundle a separate country-name dataset alongside
// libphonenumber-js's own calling-code metadata.
const regionNames = typeof Intl !== "undefined" ? new Intl.DisplayNames(["en"], { type: "region" }) : null;

function countryName(code: CountryCode): string {
  return regionNames?.of(code) ?? code;
}

/** Country-code selector + national number field, combined into a single
 * E.164 value (e.g. "+919876543210") submitted via one hidden input —
 * server-side validation (phoneSchema in app/actions/auth.ts) uses
 * libphonenumber-js's own isValidPhoneNumber() against that same string,
 * so client and server agree on what "valid" means without duplicating
 * per-country rules. Defaults to India, matching this app's primary market. */
export function PhoneInput({
  id,
  name,
  required,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
}: {
  id?: string;
  name: string;
  required?: boolean;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}) {
  const [country, setCountry] = useState<CountryCode>(DEFAULT_COUNTRY);
  const [nationalNumber, setNationalNumber] = useState("");
  const selectId = useId();

  const countries = useMemo(
    () =>
      getCountries()
        .map((code) => ({ code, name: countryName(code), callingCode: getCountryCallingCode(code) }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    []
  );

  const callingCode = getCountryCallingCode(country);
  const digitsOnly = nationalNumber.replace(/\D/g, "");
  const combinedValue = digitsOnly ? `+${callingCode}${digitsOnly}` : "";

  return (
    <div className="flex gap-2">
      <Select value={country} onValueChange={(value) => setCountry(value as CountryCode)}>
        <SelectTrigger id={selectId} aria-label="Country code" className="w-[6.5rem] shrink-0">
          <SelectValue>+{callingCode}</SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {countries.map((c) => (
            <SelectItem key={c.code} value={c.code}>
              {c.name} (+{c.callingCode})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        placeholder="Mobile number"
        value={nationalNumber}
        onChange={(e) => setNationalNumber(e.target.value)}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
        className={cn("flex-1")}
        required={required}
      />

      <input type="hidden" name={name} value={combinedValue} />
    </div>
  );
}
