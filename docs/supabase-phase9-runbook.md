# Supabase Migration Runbook: Phase 9

## Phase 9: Performance and Scalability Guardrails

This phase keeps the current hybrid rollout smooth while preparing the app for larger traffic later.

Implemented optimizations:

- in-memory TTL cache for public read-heavy endpoints
- explicit `Cache-Control` headers for browser and CDN reuse
- cache invalidation after admin content mutations
- React route-level lazy loading to reduce initial bundle cost

Current cache targets:

- `GET /api/courses`
- `GET /api/courses/:id/topics`
- `GET /api/topics/:id/flashcards`
- `GET /api/toeic/tests`
- `GET /api/toeic/tests/:test_id`
- `GET /api/toeic/practice-modes`

Operational note:

- data migration is still blocked until the remote Supabase project has the SQL schema from `supabase/migrations/*.sql` applied
- once the schema exists, rerun `node server/scripts/migrate-to-supabase.js`
