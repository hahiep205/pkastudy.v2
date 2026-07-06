# Supabase Migration Phase 1-5

This project is being moved to a production-ready Supabase stack with no dependency on a local MySQL backend at runtime.

## Phase 1 - Audit and Scope Lock

- Inventory of backend routes, services, models, storage, and scripts is complete.
- Runtime paths that still depend on local development defaults have been identified and normalized.
- Current backend surface grouped into:
  - auth
  - course/topic/flashcard content
  - progress and SRS
  - TOEIC
  - support/admin
  - storage

## Phase 2 - Supabase Architecture and Environment

- Frontend API base URLs now resolve at runtime instead of hardcoding local backend hosts.
- Production defaults are Supabase-first.
- Localhost fallback is only used when the app is actually running on localhost.
- Backend bootstrap no longer hard-fails when Supabase auth bootstrap is temporarily unavailable.

## Phase 3 - Schema Migration to Postgres

- Supabase migrations are present in `supabase/migrations`.
- Schema migration covers base tables, indexes, triggers, identity sync helpers, SRS RPC, RLS, and storage setup.
- Verification scripts exist for schema and data consistency.

## Phase 4 - Auth Migration

- Email/password login uses Supabase-backed session flow.
- Google OAuth is started and completed via backend Supabase integration.
- Auth session restore now syncs local app state from Supabase session data.
- The backend returns normalized auth payloads for the frontend.

## Phase 5 - Core Data Layer Migration

- Core read/write flows are backed by Supabase models and helpers.
- The SRS batch flow is implemented with Supabase RPC.
- Data verification can run against Supabase without requiring MySQL when legacy comparison is not needed.
- Frontend calls use Supabase-aware API base resolution so deployed builds do not depend on localhost.

## Validation Checklist

- Build passes.
- Auth routes are reachable.
- Google OAuth start endpoint responds with redirect.
- Production env examples are Supabase-first.
- MySQL fallback is no longer required for runtime app startup.

## Remaining Work Beyond Phase 5

- Move storage and upload flows fully into Supabase Storage.
- Move any remaining complex backend-only business logic into Edge Functions or RPC.
- Remove legacy MySQL-only scripts after final cutover.
