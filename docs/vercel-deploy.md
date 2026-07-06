# Vercel Deploy Guide

This repo is set up to deploy without a separate local Express process.

## What runs on Vercel

- Frontend: Vite build output
- Backend: Express app wrapped inside Vercel Functions in `api/`
- Database and auth: Supabase

## Required environment variables

Set these in the Vercel project settings:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- Any other Supabase-related secret keys used by the server

## Deploy flow

1. Push the repo to GitHub.
2. Import the repository into Vercel.
3. Keep the project root at the repo root.
4. Let Vercel detect the Vite frontend and `api/` serverless functions.
5. Deploy.

## Runtime behavior

- Requests to `/api/*` go to the Express app through Vercel Functions.
- All other non-file routes are rewritten to `index.html` for SPA routing.
- You do not need to run `npm run dev` on a backend server in production.
