import { redirect } from "next/navigation";

interface HomePageProps {
  searchParams: Promise<{
    code?: string;
    next?: string;
  }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  if (params.code) {
    const nextPath = params.next ? `&next=${encodeURIComponent(params.next)}` : "";
    redirect(`/auth/callback?code=${encodeURIComponent(params.code)}${nextPath}`);
  }

  // Real homepage (search, listing grid, filters) lands in the User
  // Website Core task. This confirms the scaffold boots end-to-end first.
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="glass-surface glass-specular max-w-md rounded-(--glass-radius-lg) p-8 text-center">
        <h1 className="text-2xl font-semibold">Vehicle Listing Platform</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Scaffold is up. Search and listings land next.
        </p>
      </div>
    </main>
  );
}
