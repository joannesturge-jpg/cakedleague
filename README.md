# Caked Leagues

Next.js app for cakedleagues.com — email/password accounts, password reset, and an
admin dashboard at admin.cakedleagues.com.

## Local setup

1. `npm install`
2. Copy `.env.example` to `.env` and fill in `DATABASE_URL` and `JWT_SECRET` (see below).
3. `npx prisma migrate deploy` to create the database tables (the migration is already checked in — this just applies it).
4. `npm run dev` and visit http://localhost:3000.

In production, `npm run build` runs `prisma migrate deploy` automatically before building, so
Vercel creates/updates the tables on every deploy — no manual step needed there.

Sign up with the email you listed in `ADMIN_EMAILS` to get admin access. Locally,
visit http://localhost:3000/admin directly (subdomain routing is only enforced
in production — see `app/admin/page.tsx`).

## Environment variables

- `DATABASE_URL` / `DIRECT_URL` — Supabase's pooler connection strings, from
  the project's Connect dialog. Use "Transaction pooler" (port 6543) for
  `DATABASE_URL` and "Session pooler" (port 5432) for `DIRECT_URL` — do NOT
  use the plain "Direct connection" string (`db.<ref>.supabase.co`), it's
  IPv6-only and unreachable from Vercel's build environment.
- `JWT_SECRET` — any random string, e.g. `openssl rand -hex 32`.
- `ADMIN_EMAILS` — comma-separated emails that get admin access.
- `RESEND_API_KEY` — optional in dev (reset links print to the server console
  instead of emailing). Get a key at resend.com to actually send emails.
- `COOKIE_DOMAIN` — set to `.cakedleagues.com` in production so one login
  works on both the main site and the admin subdomain.

## Deploying

Built for Vercel: connect this repo (or this directory, if it stays inside a
larger repo — set the Vercel project's root directory accordingly), add the
env vars above, then add both `cakedleagues.com` and `admin.cakedleagues.com`
as domains on the project. Point GoDaddy's DNS at Vercel per their dashboard
instructions once the domains are added.
