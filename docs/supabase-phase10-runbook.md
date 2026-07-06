# Supabase Migration Runbook: Phase 10

## Goal

Cut over from the current hybrid mode to a stable Supabase-first runtime with clear rollback steps.

## Step 1: Apply remote schema

Run these SQL files in order inside the Supabase SQL editor:

1. `supabase/migrations/0001_base_schema.sql`
2. `supabase/migrations/0002_indexes_and_constraints.sql`
3. `supabase/migrations/0003_triggers_and_auth_sync.sql`
4. `supabase/migrations/0004_identity_sync_helpers.sql`
5. `supabase/migrations/0005_srs_rpc.sql`
6. `supabase/migrations/0006_rls_policies.sql`
7. `supabase/migrations/0007_storage_setup.sql`

Then verify:

- `node server/scripts/verify-supabase-schema.js`

Expected:

- all required tables report `OK`
- bucket `toeic-media` reports `OK`

## Step 2: Migrate data

Dry run:

- `node server/scripts/migrate-to-supabase.js --dry-run`

Real migration:

- `node server/scripts/migrate-to-supabase.js`

Then verify counts:

- `node server/scripts/verify-supabase-data.js`

Expected:

- row counts match between MySQL and Supabase for the mapped tables

## Step 3: Switch runtime mode

Update `server/.env`:

- `USE_SUPABASE_DB=true`
- keep `SUPABASE_DB_FALLBACK=true` for burn-in

Keep:

- `USE_SUPABASE_STORAGE=true`

## Step 4: QA

Validate end-to-end flows:

- register/login/logout
- dashboard courses/topics/flashcards
- custom topics CRUD
- TOEIC test list/details/submit/history
- SRS due queue and review
- support ticket create/admin review
- TOEIC upload to Storage

## Step 5: Burn-in and fallback removal

After stable verification:

- set `SUPABASE_DB_FALLBACK=false`

Only do this after:

- production-like QA passes
- no auth mapping issues remain
- no RLS false denials remain

## Step 6: Rollback path

If Supabase DB issues appear:

1. set `USE_SUPABASE_DB=false`
2. keep Supabase Auth enabled
3. keep MySQL as the primary read/write source temporarily
4. fix schema, RLS, or migrated data
5. rerun verification scripts before enabling Supabase DB again

## Cleanup done in repo

- removed unused Firebase frontend file
- removed unused Firebase Admin helper
- added Supabase schema verification script
- added Supabase data verification script
