# Supabase Migration Runbook: Phases 7-8

## Phase 7: RLS

Apply `supabase/migrations/0006_rls_policies.sql` after:

- `profiles` rows have been synced for active users
- owner-facing tables already use `uuid user_id` mappings

This migration adds:

- `public.is_admin()`
- row-level security enablement for core tables
- owner/admin/public policies aligned with the migration blueprint

## Phase 8: Storage

Apply `supabase/migrations/0007_storage_setup.sql` to create the public bucket:

- `toeic-media`

Backend behavior:

- when `USE_SUPABASE_STORAGE=true`, TOEIC uploads go to Supabase Storage
- when disabled, the current local disk upload flow remains active

Recommended rollout:

1. keep local disk flow working
2. apply storage migration
3. verify admin upload route with Supabase
4. only then remove legacy local files if desired
