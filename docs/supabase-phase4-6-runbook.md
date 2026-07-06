# Supabase Migration Runbook: Phases 4-6

## Phase 4

Use the migration script in `server/scripts/migrate-to-supabase.js` to:

- create or align Supabase Auth users for current MySQL users
- upsert `profiles`
- upsert catalog and user-owned learning data
- preserve current integer ids for catalog tables
- preserve user mapping via `profiles.legacy_user_id`

Suggested first run:

```powershell
cd server
node scripts/migrate-to-supabase.js --dry-run
```

Then:

```powershell
cd server
node scripts/migrate-to-supabase.js
```

## Phase 5

When `USE_SUPABASE_DB=true`, the following modules now prefer Supabase-backed access:

- `courseModel`
- `topicModel`
- `customCoursesModel`
- `progressModel`
- `vocabActivityModel`
- `srsModel` read paths

This allows a staged cutover after the migration script has loaded the data.

Recommended local safety default:

- keep `USE_SUPABASE_DB=false` until the migration script has completed successfully
- turn it on only after row counts and auth/profile mappings have been verified

## Phase 6

RPC introduced:

- `enqueue_immediate_reviews`
- `submit_srs_review_batch`
- `sync_identity_sequences`

These are intended to move the transaction-heavy SRS write path closer to the database while keeping the current Express API contract stable.
