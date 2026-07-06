# Supabase Migration Phase 6-10

This document tracks the final cleanup path to a production-ready Supabase-only deployment.

## Phase 6 - RLS Hardening

- RLS policies exist for the core tables:
  - `profiles`
  - `user_progress`
  - `courses`
  - `topics`
  - `flashcards`
  - `user_word_progress`
  - `srs_reviews`
  - `toeic_tests`
  - `toeic_question_groups`
  - `toeic_questions`
  - `toeic_test_records`
  - `support_tickets`
  - `vocab_activity_logs`
- `is_admin()` is centralized in SQL so client-side code does not decide privileges.

## Phase 7 - Storage Cutover

- TOEIC uploads support Supabase Storage through `server/lib/supabaseStorage.js`.
- Upload middleware already uses memory storage when Supabase Storage is enabled.
- Local upload fallback remains only as a legacy path and should not be used in production.

## Phase 8 - RPC / Edge Function Readiness

- SRS review batch processing is already implemented as SQL RPC.
- Complex admin flows are still expressible through Supabase-backed model helpers.
- Any remaining server-only logic should move to Edge Functions instead of growing the local backend.

## Phase 9 - Frontend Cutover

- Login now resolves directly through Supabase Auth instead of the backend session endpoint.
- The auth context restores the active user from Supabase session data and profile rows.
- API base URLs resolve from the current deployment origin so production builds do not depend on localhost.

## Phase 10 - Backend Cleanup

- Runtime code paths no longer need MySQL for day-to-day app startup.
- Legacy MySQL access remains only inside migration or comparison scripts.
- The next removal step is deleting or isolating the remaining legacy server scripts and any local upload fallback.

## Current Verification

- `npm run build` passes.
- Phase 1-5 verification passes.
- Supabase schema and data verification require a live network path to the Supabase project.
- Phase 6-10 verification should pass once the new auth and storage checks are applied to the deployed project state.
