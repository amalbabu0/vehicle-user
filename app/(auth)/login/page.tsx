import type { Metadata } from "next";
import { LoginForm } from "./login-form";

// The (auth) layout sets a group-wide `robots: noindex` already; each page
// here still needs its own title since login-form.tsx is a client
// component and can't export metadata itself — without this every auth
// page fell back to the root layout's default title.
export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return <LoginForm />;
}
