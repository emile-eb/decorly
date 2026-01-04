Decorly Monorepo (MVP)

This repo contains a minimal but shippable MVP for an iPhone app that redesigns a room photo using GPT on the backend. It’s set up for Windows 11 development, Expo (managed), EAS remote iOS builds (no local Mac required), Supabase (Auth + Postgres + Storage), and RevenueCat subscriptions. The backend is Node.js (TypeScript) with Fastify.

Structure
- `apps/mobile` – Expo React Native app (TypeScript)
- `apps/api` – Fastify API (TypeScript) + worker loop
- `supabase/` – SQL migrations and RLS/storage policies

Prerequisites (Windows 11)
- Node.js 18+ and pnpm
  - Install pnpm: `npm i -g pnpm`
- Git
- Supabase project (cloud) – we’ll apply SQL in the SQL editor or via Supabase CLI
- EAS CLI for iOS builds (remote): `npm i -g eas-cli`

Environment Variables
- Mobile (`apps/mobile/.env` or EAS env vars)
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `API_BASE_URL` (e.g., `http://localhost:4000` for local dev)
  - `REVENUECAT_PUBLIC_SDK_KEY`
- API (`apps/api/.env`)
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `OPENAI_API_KEY`
  - `REVENUECAT_SECRET_KEY`
  - `REVENUECAT_WEBHOOK_SECRET` (optional)
  - `ENTITLEMENT_ID` (e.g., `pro`)

Install Dependencies (root, PowerShell)
- `pnpm install`

Run Locally (PowerShell)
- UI only (no backend needed): `npm run dev` then press `w` for web
- Full stack: `npm run dev:all`
- Or individually:
  - API: `npm run dev:api`
  - Worker: `npm run dev:worker`
  - Mobile: `npm run dev:mobile` (press `w` to open web)

Expo + EAS Notes (iOS on Windows)
- You can build for iOS using EAS remote builders from Windows. No local macOS is required.
- Login to EAS: `eas login`
- Configure iOS build profile in `apps/mobile/eas.json`.
- Set env vars in EAS project (Dashboard or `eas secret:create`).
- Build: (from `apps/mobile`) `eas build -p ios --profile production`
- Submit to TestFlight/App Store via EAS submit or App Store Connect.

Supabase Setup
1) Create a Supabase project in the cloud.
2) Apply `supabase/migrations/0001_create_jobs.sql` and `0002_policies.sql` in the SQL editor.
3) Confirm private storage buckets `room_inputs` and `room_outputs` are created.
4) Ensure RLS is enabled on `jobs` and storage policies are in place.

RevenueCat Setup
- Create a project in RevenueCat; configure products and "pro" entitlement (or set your own and match `ENTITLEMENT_ID`).
- Get the Public SDK key (for mobile) and Secret key (for backend).
- In the mobile app, the App User ID is set to the Supabase `user.id`.

OpenAI Setup
- Add `OPENAI_API_KEY` to the API `.env`.
- The worker uses GPT Vision for analysis and image generation for the edited room image.

Workflow Overview
1) User signs in (Supabase).
2) User picks/captures a room photo; app compresses and uploads to `room_inputs/{user_id}/{uuid}.jpg`.
3) App calls `POST /v1/jobs` with `{ style, constraints, inputImagePath }`.
4) Server verifies Supabase JWT and RevenueCat entitlement, queues a job in DB.
5) Worker polls for queued jobs, processes via OpenAI, uploads outputs to `room_outputs/{user_id}/{job_id}_v1.png`, updates job.
6) App polls `GET /v1/jobs/:id` until `status=complete`, then displays signed output URLs.

Windows Tips
- Use PowerShell-friendly commands from scripts in package.json files.
- No local iOS build steps assumed. All iOS builds use EAS remote builders.

Licensing/Keys
- Never place secrets in the mobile app. All secrets remain in the backend or EAS secrets.
- The mobile uses only the Supabase anon key and RevenueCat public SDK key.
