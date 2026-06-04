# JustMyType

JustMyType is a Supabase-backed dating app for `justmytype.help`.

## Features

- Email magic-link auth through Supabase.
- Profile creation with photo upload to the public `profile-photos` bucket.
- `pgvector` profile embeddings using `text-embedding-3-small`.
- AI-ranked discovery through the `match_profiles` RPC.
- Like/pass swipes with automatic mutual matches.
- Match chat with Supabase row-level security.
- GitHub Actions deployment to Hostinger over FTP.

## Setup

1. Create a Supabase project.
2. Run `supabase/migrations/002_upgrade_existing_project.sql` if you are upgrading the existing VibeMatch schema, then `003_cleanup_advisor_findings.sql`.
3. Confirm the `profile-photos` bucket exists and is public.
4. Copy `.env.example` to `.env.local` and fill in Supabase values.
5. For production AI matching, deploy `supabase/functions/embed-profile` and set `OPENAI_API_KEY` as a Supabase secret.
6. Run `npm install`, then `npm run dev` locally.

## GitHub and Hostinger

Add these GitHub Actions secrets:

- `FTP_SERVER`
- `FTP_USERNAME`
- `FTP_PASSWORD`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- Optional: `VITE_OPENAI_API_KEY` for browser-side embedding fallback.

Every push to `main` builds the app and uploads `dist/` to Hostinger.
