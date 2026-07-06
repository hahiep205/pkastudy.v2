require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function exists(filePath) {
  return fs.existsSync(filePath);
}

function assertCheck(name, ok, details = '') {
  process.stdout.write(`${ok ? 'OK' : 'FAIL'} ${name}${details ? `: ${details}` : ''}\n`);
  return ok;
}

function checkIncludes(filePath, snippets) {
  if (!exists(filePath)) {
    return { ok: false, details: 'file missing' };
  }

  const content = read(filePath);
  for (const snippet of snippets) {
    if (!content.includes(snippet)) {
      return { ok: false, details: `missing "${snippet}"` };
    }
  }

  return { ok: true, details: '' };
}

async function main() {
  const root = path.join(__dirname, '..', '..');

  const checks = [
    {
      name: 'Phase 1 audit doc',
      ...checkIncludes(path.join(root, 'docs', 'supabase-migration-phase-1-5.md'), ['Phase 1 - Audit and Scope Lock']),
    },
    {
      name: 'Phase 2 runtime API resolution',
      ...checkIncludes(path.join(root, 'src', 'utils', 'axiosClient.js'), ['resolveApiBaseUrl', 'window.location']),
    },
    {
      name: 'Phase 2 API helper resolution',
      ...checkIncludes(path.join(root, 'src', 'utils', 'apiClient.js'), ['resolveApiBaseUrl', 'window.location']),
    },
    {
      name: 'Phase 3 Supabase migrations',
      ...checkIncludes(path.join(root, 'supabase', 'migrations', '0001_base_schema.sql'), ['create table']),
    },
    {
      name: 'Phase 3 schema coverage',
      ...checkIncludes(path.join(root, 'supabase', 'migrations', '0006_rls_policies.sql'), ['profiles', 'user_progress', 'srs_reviews']),
    },
    {
      name: 'Phase 4 auth routes',
      ...checkIncludes(path.join(root, 'server', 'routes', 'authRoutes.js'), ['google/start', 'google/complete', 'session']),
    },
    {
      name: 'Phase 4 login flow',
      ...checkIncludes(path.join(root, 'src', 'pages', 'Login.jsx'), ['supabase.auth.signInWithPassword', 'supabase.auth.signInWithOAuth']),
    },
    {
      name: 'Phase 5 SRS RPC',
      ...checkIncludes(path.join(root, 'supabase', 'migrations', '0005_srs_rpc.sql'), ['submit_srs_review_batch', 'enqueue_immediate_reviews']),
    },
    {
      name: 'Phase 5 Supabase model layer',
      ...checkIncludes(path.join(root, 'server', 'lib', 'supabaseData.js'), ['ensureSupabaseEnabled', 'fetchTopicsWithVocabularyCounts']),
    },
  ];

  let failed = false;
  for (const check of checks) {
    const ok = assertCheck(check.name, check.ok, check.details);
    if (!ok) failed = true;
  }

  if (failed) {
    process.exitCode = 1;
    return;
  }

  process.stdout.write('Phase 1-5 verification passed.\n');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
