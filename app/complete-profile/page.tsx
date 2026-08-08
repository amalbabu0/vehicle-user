import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CompleteProfileForm } from "@/components/complete-profile-form";

// Only reached right after a brand-new Google sign-up (see
// app/auth/callback/route.ts) — transient, account-specific, nothing here
// is worth indexing.
export const metadata: Metadata = {
  title: "Complete your profile",
  robots: { index: false, follow: false },
};

export default async function CompleteProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("full_name, avatar_url, phone")
    .eq("id", user.id)
    .maybeSingle();

  // Already completed this step (e.g. navigated back here after the fact)
  // — nothing left to ask, just continue to the site.
  if (profile?.phone) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="glass-surface glass-specular w-full max-w-sm rounded-(--glass-radius-lg) p-8">
        <h1 className="text-xl font-semibold">Almost done</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add your mobile number to finish setting up your account.
        </p>
        <div className="mt-6">
          <CompleteProfileForm fullName={profile?.full_name ?? user.user_metadata?.full_name ?? null} avatarUrl={profile?.avatar_url ?? null} />
        </div>
      </div>
    </main>
  );
}
