import type { Metadata } from "next";
import { getCurrentProfile, verifySession } from "@/lib/auth/dal";
import { UserSettingsForm } from "@/components/user-settings-form";

export const metadata: Metadata = { title: "Settings" };
export const revalidate = 0;

export default async function SettingsPage() {
  const [profile, user] = await Promise.all([getCurrentProfile(), verifySession()]);
  return <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6"><div className="mb-6"><h1 className="text-2xl font-semibold">Settings</h1><p className="mt-1 text-sm text-muted-foreground">Manage your profile and account security.</p></div><UserSettingsForm name={profile.full_name} phone={profile.phone} email={user.email ?? ""} /></main>;
}
