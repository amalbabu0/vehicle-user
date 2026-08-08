/** Pure, client-safe password scoring — no network calls, nothing persisted
 * or logged. Requirements here are deliberately identical to the backend's
 * passwordSchema (app/actions/auth.ts) so the frontend never asks for more
 * (or less) than what actually gets enforced on submit. */

export type PasswordRequirements = {
  minLength: boolean;
  hasLetter: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
};

export type PasswordStrengthLabel = "Weak" | "Fair" | "Good" | "Strong";

export type PasswordStrengthResult = {
  /** 0-6, used only to size the visual bar — not shown to the user directly. */
  score: number;
  label: PasswordStrengthLabel;
  requirements: PasswordRequirements;
  /** Mirrors the backend's passwordSchema exactly — this is what actually
   * gates submission, independent of the (softer, more gradual) label above. */
  meetsAllRequirements: boolean;
};

const LABELS: PasswordStrengthLabel[] = ["Weak", "Fair", "Good", "Strong"];

// A short list of the most common real-world passwords — not a breach
// database, just enough to catch the obvious cases ("password", "123456",
// etc.) that pass the character-class checks but are trivially guessable.
const COMMON_PASSWORDS = new Set([
  "password", "12345678", "123456789", "qwerty123", "password1",
  "11111111", "123123123", "letmein123", "welcome123", "abc12345",
  "monkey123", "dragon123", "iloveyou1", "admin1234", "football1",
  "baseball1", "sunshine1", "princess1", "qwertyuiop", "1q2w3e4r",
]);

function getRequirements(password: string): PasswordRequirements {
  return {
    minLength: password.length >= 8,
    hasLetter: /[a-zA-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[^a-zA-Z0-9]/.test(password),
  };
}

export function calculatePasswordStrength(password: string): PasswordStrengthResult {
  const requirements = getRequirements(password);
  const meetsAllRequirements = Object.values(requirements).every(Boolean);

  if (!password) {
    return { score: 0, label: "Weak", requirements, meetsAllRequirements: false };
  }

  let points = 0;
  if (requirements.minLength) points += 1;
  if (password.length >= 12) points += 1;
  if (requirements.hasLetter) points += 1;
  if (requirements.hasNumber) points += 1;
  if (requirements.hasSpecialChar) points += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) points += 1;
  if (/(.)\1{2,}/.test(password)) points -= 1; // 3+ repeated char in a row

  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    points = 0;
  }

  const score = Math.max(0, Math.min(6, points));

  // 0-1 -> Weak, 2-3 -> Fair, 4-5 -> Good, 6 -> Strong
  let labelIndex = score <= 1 ? 0 : score <= 3 ? 1 : score <= 5 ? 2 : 3;

  // A password missing one of the actual backend requirements can still
  // show progress (better than flatly "Weak" the moment one thing is
  // missing), but never Good/Strong — those imply "this would work."
  if (!meetsAllRequirements) {
    labelIndex = Math.min(labelIndex, 1);
  }

  return { score, label: LABELS[labelIndex], requirements, meetsAllRequirements };
}
