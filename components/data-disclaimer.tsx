/**
 * Shared so the Terms and Privacy pages carry byte-identical wording — two
 * copies of a liability sentence drift the moment one page is edited, and a
 * disclaimer that says different things in different places is worse than
 * one that says nothing.
 *
 * Note this states a limit of responsibility; it does not remove one. Under
 * India's DPDP Act 2023 the platform is a Data Fiduciary for the account and
 * visit data it collects regardless of what this paragraph says, which is
 * why both pages also tell the reader to get the text reviewed.
 */
export function DataDisclaimer() {
  return (
    <p className="mt-10 border-t border-border pt-4 text-xs leading-6 text-muted-foreground">
      Kerala Lease Hub is not responsible for any personal data shared on or through this platform, or for its
      safety. You share your information at your own risk.
    </p>
  );
}
