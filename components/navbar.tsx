import { createClient } from "@/lib/supabase/server";
import { NavbarClient } from "@/components/navbar-client";

export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return <NavbarClient user={null} />;

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <NavbarClient
      user={{
        fullName: profile?.full_name ?? null,
        avatarUrl: profile?.avatar_url ?? null,
        email: user.email ?? "",
      }}
    />
  );
}
