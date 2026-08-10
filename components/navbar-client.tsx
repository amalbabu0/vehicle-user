"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { ChevronDown, Moon, Sun, Heart, LogOut, Monitor, Settings } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { useSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV_LINKS = [
  { href: "/vehicles", label: "Browse Vehicles" },
  { href: "/vehicles?category=cars", label: "Cars" },
  { href: "/vehicles?category=bikes", label: "Bikes" },
  { href: "/sell", label: "List Your Vehicle" },
];

type NavbarUser = { fullName: string | null; avatarUrl: string | null; email: string } | null;

/**
 * Fetches its own auth state client-side (rather than the page/layout
 * fetching it server-side with cookies()) so pages that render this don't
 * get forced into dynamic (per-request) rendering just because the navbar
 * needs to know who's signed in — see PERFORMANCE.md's "Status" section on
 * why that mattered here. Shows a skeleton avatar-slot until resolved.
 */
export function NavbarClient() {
  const supabase = useSupabaseBrowserClient();
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState<NavbarUser>(null);
  const [resolved, setResolved] = useState(false);
  const [themeExpanded, setThemeExpanded] = useState(false);

  useEffect(() => {
    if (!supabase) return;

    let active = true;

    const loadUser = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        if (active) {
          setUser(null);
          setResolved(true);
        }
        return;
      }

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("full_name, avatar_url")
        .eq("id", authUser.id)
        .maybeSingle();

      if (active) {
        setUser({ fullName: profile?.full_name ?? null, avatarUrl: profile?.avatar_url ?? null, email: authUser.email ?? "" });
        setResolved(true);
      }
    };

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => loadUser());

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <header className="glass-surface sticky top-0 z-40 border-b border-transparent px-4 py-3 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-1.5 text-base font-semibold no-underline text-foreground sm:gap-2 sm:text-lg">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-foreground text-[10px] font-extrabold tracking-tighter text-background sm:size-7">
            KLH
          </span>
          <span className="whitespace-nowrap">Kerala Lease Hub</span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm font-medium text-foreground no-underline hover:text-primary">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {!resolved ? (
            <Skeleton className="size-8 rounded-full" />
          ) : user ? (
            <DropdownMenu onOpenChange={(open) => { if (!open) setThemeExpanded(false); }}>
              <DropdownMenuTrigger asChild>
                <button type="button" className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Open profile menu">
                  <Avatar>
                    <AvatarImage src={user.avatarUrl ?? undefined} alt={user.fullName ?? user.email} />
                    <AvatarFallback>{(user.fullName ?? user.email).charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={8} className="w-[calc(100vw-1.5rem)] max-w-72 p-2">
                <div className="flex flex-col items-center px-3 py-4 text-center">
                  <Avatar className="size-16"><AvatarImage src={user.avatarUrl ?? undefined} alt={user.fullName ?? user.email} /><AvatarFallback className="text-xl">{(user.fullName ?? user.email).charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                  <p className="mt-3 w-full truncate text-sm font-medium">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="min-h-10 gap-3 px-3 py-2">
                  <Link href="/favorites">
                    <Heart className="size-4" /> Favorites
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="min-h-10 gap-3 px-3 py-2"
                  onSelect={(event) => {
                    event.preventDefault();
                    setThemeExpanded((open) => !open);
                  }}
                >
                  {theme === "dark" ? <Moon className="size-4" /> : theme === "light" ? <Sun className="size-4" /> : <Monitor className="size-4" />}
                  Theme
                  <ChevronDown className={`ml-auto size-4 shrink-0 transition-transform ${themeExpanded ? "rotate-180" : ""}`} />
                </DropdownMenuItem>
                {themeExpanded && (
                  <DropdownMenuRadioGroup value={theme} onValueChange={setTheme} className="flex flex-col gap-0.5 py-0.5 pl-2">
                    <DropdownMenuRadioItem value="light" className="min-h-9 gap-3 px-3 py-1.5"><Sun className="size-4" /> Light</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="dark" className="min-h-9 gap-3 px-3 py-1.5"><Moon className="size-4" /> Dark</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="system" className="min-h-9 gap-3 px-3 py-1.5"><Monitor className="size-4" /> System</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                )}
                <DropdownMenuItem asChild className="min-h-10 gap-3 px-3 py-2"><Link href="/settings"><Settings className="size-4" /> Settings</Link></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild variant="destructive" className="min-h-10 gap-3 px-3 py-2">
                  <form action={logout} className="w-full">
                    <button type="submit" className="flex w-full items-center gap-2">
                      <LogOut className="size-4" /> Logout
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login" className="no-underline">
              <Button size="sm">Sign in</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
