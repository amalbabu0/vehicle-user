# User Website

Public, SEO-first vehicle discovery site for the Vehicle Listing
Platform. Independent repo/Vercel project/domain from the
[Admin + Lister Portal](../admin) — same Supabase project, but this app
is deliberately **read-mostly**: no service-role key, no R2 write
credentials. See [`../06-liquid-glass-style.md`](../06-liquid-glass-style.md)
for the design system and the root-level `NN-*.md` docs for full product
specs.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui ·
React Hook Form + Zod · TanStack Query · Zustand · Framer Motion ·
Supabase (Auth, Postgres, Realtime, RLS) · Cloudflare R2 + CDN (custom
domain, read-only here) · Upstash Redis

## Getting started

```bash
pnpm install
cp .env.example .env.local   # fill in real values — see below
pnpm dev --port 3001
```

> **Windows note:** this machine's Application Control policy blocks the
> native SWC binary, so `dev`/`build` are pinned to `--webpack`. That
> flag is safe to keep on Linux/Vercel too (just slower); remove it only
> if you've confirmed Turbopack's native binary loads on your machine.

## Environment variables

See [`.env.example`](.env.example). This app only ever holds the anon
key and the public `IMAGES_CDN_URL` — no service-role key, no R2 write
credentials, by design. Image uploads happen exclusively in the admin
app (presigned R2 URLs); this app only renders the resulting CDN URLs.

## Access model

Browsing, search, and vehicle details are public reads. Favorites,
enquiries, and profile are writes scoped to the signed-in user's own
rows via Supabase RLS (`auth.uid()`). This app has no path to write
vehicle/listing data or another user's rows — that boundary is enforced
in Postgres (RLS), not just in this app's code.

## Structure

```
app/
  (auth)/          login, register, forgot/reset password, verify-email
  (site)/          public site shell (home, search, details — later tasks)
lib/
  env.ts           Zod-validated server env
  supabase/        browser + server (RLS-scoped) clients — no service role
  utils.ts         shadcn's cn() helper
components/
  ui/              shadcn/ui primitives
  providers/       React Query, Tooltip, Toaster
proxy.ts           Next 16's renamed Middleware — session-cookie refresh only
```
