require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function exists(filePath) {
  return fs.existsSync(filePath);
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

function walkFiles(rootDir, predicate = () => true, results = []) {
  if (!fs.existsSync(rootDir)) {
    return results;
  }

  for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, predicate, results);
      continue;
    }
    if (entry.isFile() && predicate(fullPath)) {
      results.push(fullPath);
    }
  }

  return results;
}

function printCheck(name, result) {
  process.stdout.write(`${result.ok ? 'OK' : 'FAIL'} ${name}${result.details ? `: ${result.details}` : ''}\n`);
  return result.ok;
}

async function main() {
  const root = path.join(__dirname, '..', '..');
  const serverRoot = path.join(root, 'server');
  const runtimeDirs = ['controllers', 'lib', 'middlewares', 'models', 'routes', 'services'];
  const runtimeFiles = [
    path.join(serverRoot, 'app.js'),
    path.join(serverRoot, 'index.js'),
    path.join(serverRoot, 'supabase.js'),
    ...runtimeDirs.flatMap((dir) => walkFiles(path.join(serverRoot, dir), (filePath) => filePath.endsWith('.js'))),
  ];

  const legacyImportHits = runtimeFiles.filter((filePath) => {
    const content = read(filePath);
    return content.includes("mysql2/promise")
      || content.includes("require('../db')")
      || content.includes('require("../db")')
      || content.includes("require('./db')")
      || content.includes('require("./db")');
  });

  const checks = [
    {
      name: 'Phase 6 RLS policies',
      ...checkIncludes(path.join(root, 'supabase', 'migrations', '0006_rls_policies.sql'), [
        'profiles_select_own_or_admin',
        'user_progress_select_own_or_admin',
        'flashcards_select_policy',
        'toeic_test_records_policy',
        'vocab_activity_logs_policy',
      ]),
    },
    {
      name: 'Phase 7 storage setup',
      ...checkIncludes(path.join(root, 'supabase', 'migrations', '0007_storage_setup.sql'), [
        'toeic-media',
        'storage',
      ]),
    },
    {
      name: 'Phase 7 upload middleware',
      ...checkIncludes(path.join(root, 'server', 'middlewares', 'uploadMiddleware.js'), [
        'useSupabaseStorage',
        'memoryStorage',
      ]),
    },
    {
      name: 'Phase 7 storage helper',
      ...checkIncludes(path.join(root, 'server', 'lib', 'supabaseStorage.js'), [
        'uploadToeicFile',
        'useSupabaseStorage',
      ]),
    },
    {
      name: 'Phase 8 SRS RPC',
      ...checkIncludes(path.join(root, 'supabase', 'migrations', '0005_srs_rpc.sql'), [
        'submit_srs_review_batch',
        'enqueue_immediate_reviews',
      ]),
    },
    {
      name: 'Phase 9 direct auth login',
      ...checkIncludes(path.join(root, 'src', 'pages', 'Login.jsx'), [
        'supabase.auth.signInWithPassword',
        'supabase.auth.signInWithOAuth',
      ]),
    },
    {
      name: 'Phase 9 direct auth register',
      ...checkIncludes(path.join(root, 'src', 'pages', 'Register.jsx'), [
        'supabase.auth.signUp',
      ]),
    },
    {
      name: 'Phase 9 auth context sync',
      ...checkIncludes(path.join(root, 'src', 'contexts', 'AuthContext.jsx'), [
        "supabase.auth.getUser",
        "from('profiles')",
      ]),
    },
    {
      name: 'Phase 9 runtime API resolution',
      ...checkIncludes(path.join(root, 'src', 'utils', 'axiosClient.js'), [
        'resolveApiBaseUrl',
        'window.location',
      ]),
    },
    {
      name: 'Phase 10 legacy compare lazy load',
      ...checkIncludes(path.join(root, 'server', 'scripts', 'verify-supabase-data.js'), [
        'getMysqlPool',
        'VERIFY_WITH_MYSQL',
      ]),
    },
    {
      name: 'Phase 10 migration docs',
      ...checkIncludes(path.join(root, 'docs', 'supabase-migration-phase-6-10.md'), [
        'Phase 10 - Backend Cleanup',
      ]),
    },
    {
      name: 'Phase 10 runtime has no MySQL imports',
      ok: legacyImportHits.length === 0,
      details: legacyImportHits.length ? `found legacy imports in ${legacyImportHits.length} runtime file(s)` : '',
    },
  ];

  let failed = false;
  for (const check of checks) {
    const ok = printCheck(check.name, { ok: check.ok, details: check.details });
    if (!ok) failed = true;
  }

  if (failed) {
    process.exitCode = 1;
    return;
  }

  process.stdout.write('Phase 6-10 verification passed.\n');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
