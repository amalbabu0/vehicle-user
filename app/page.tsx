export default function HomePage() {
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
