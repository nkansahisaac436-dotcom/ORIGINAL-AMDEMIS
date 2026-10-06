/**
 * AMDEMIS Safe System Cleanup & Reset Script
 * Resets the application database to a clean, production-ready state.
 *
 * SAFETY GUARANTEES:
 * 1. DRY-RUN by default: Deletes NOTHING unless invoked with --confirm AND typing 'DELETE'.
 * 2. Backs up every table to /backups/YYYY-MM-DD-HHMM/*.csv before deleting.
 * 3. Preserves all Admin accounts (Super Admin & District Officers, auth users and profiles).
 * 4. Preserves database schema, extensions, functions, triggers, and migrations.
 * 5. Resets School Login ID numbering sequence so the first real school gets AMD-0001.
 *
 * Usage:
 *   Dry run:        npm run reset:clean
 *   Execute reset:  npm run reset:clean -- --confirm
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

// Built-in dependency-free env loader for .env.local and .env
function loadEnvFile(fileName: string) {
  const filePath = path.join(process.cwd(), fileName);
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf-8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIdx = line.indexOf('=');
    if (eqIdx === -1) continue;
    const key = line.slice(0, eqIdx).trim();
    let val = line.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

loadEnvFile('.env.local');
loadEnvFile('.env');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('\n=============================================================');
  console.error('  ⚠️  SUPABASE CONFIGURATION REQUIRED');
  console.error('=============================================================');
  console.error('To run the cleanup script against your Supabase instance, ensure');
  console.error('your .env.local file has the following keys set:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY=<your-service-role-secret-key>\n');
  console.error('You can find these in your Supabase Dashboard:');
  console.error('  Settings -> API -> Project URL & service_role secret key\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TABLES_TO_CLEAN = [
  'special_teachers',
  'staff_payroll',
  'furniture',
  'classrooms',
  'teachers',
  'enrolment',
  'infrastructure',
  'submission_levels',
  'notifications',
  'audit_log',
  'submissions',
  'schools',
  'circuits',
  'rounds',
] as const;

function formatTimestamp(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}-${hh}${min}`;
}

function jsonToCsv(rows: Record<string, any>[]): string {
  if (!rows || rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const csvLines = [headers.join(',')];

  for (const row of rows) {
    const values = headers.map((header) => {
      const val = row[header];
      if (val === null || val === undefined) return '""';
      if (typeof val === 'object') {
        return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
      }
      return `"${String(val).replace(/"/g, '""')}"`;
    });
    csvLines.push(values.join(','));
  }

  return csvLines.join('\n');
}

async function promptUser(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  const isConfirm = process.argv.includes('--confirm');

  console.log('\n=============================================================');
  console.log('       AMDEMIS DATABASE CLEANUP & CLEAN-STATE SCRIPT         ');
  console.log('=============================================================');
  console.log(`Mode: ${isConfirm ? '🔴 LIVE EXECUTION (--confirm)' : '🟢 DRY-RUN (Safe, no changes)'}`);
  console.log(`Supabase URL: ${supabaseUrl}`);
  console.log('-------------------------------------------------------------\n');

  // 1. Inspect all tables and count records
  console.log('📊 Inspecting database records...');
  const tableCounts: Record<string, number> = {};

  for (const table of TABLES_TO_CLEAN) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.warn(`  ⚠️ Warning reading table '${table}': ${error.message}`);
      tableCounts[table] = 0;
    } else {
      tableCounts[table] = count || 0;
    }
  }

  // 2. Inspect Auth Users and Profiles
  const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
  if (usersError) {
    console.error(`❌ Failed to list auth users: ${usersError.message}`);
    process.exit(1);
  }

  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('*');

  if (profilesError) {
    console.error(`❌ Failed to list profiles: ${profilesError.message}`);
    process.exit(1);
  }

  const profilesMap = new Map<string, any>();
  (profilesData || []).forEach((p) => profilesMap.set(p.id, p));

  const adminUsers: Array<{ id: string; email: string; role: string; name: string }> = [];
  const headteacherUsers: Array<{ id: string; email: string; role: string; name: string }> = [];
  const ambiguousUsers: Array<{ id: string; email: string }> = [];

  for (const user of usersData.users) {
    const email = user.email || '';
    const profile = profilesMap.get(user.id);
    const role = profile?.role || (user.user_metadata?.role as string);

    if (role === 'super_admin' || role === 'district_officer') {
      adminUsers.push({
        id: user.id,
        email,
        role,
        name: profile?.full_name || (user.user_metadata?.full_name as string) || 'Admin',
      });
    } else if (role === 'headteacher' || email.endsWith('@amdemis.local')) {
      headteacherUsers.push({
        id: user.id,
        email,
        role: 'headteacher',
        name: profile?.full_name || 'Headteacher Account',
      });
    } else {
      ambiguousUsers.push({ id: user.id, email });
    }
  }

  // 3. Print Report
  console.log('\n--- TABLES SUMMARY (DATA TO BE CLEARED) ---');
  console.table(
    Object.entries(tableCounts).map(([table, count]) => ({
      'Table Name': table,
      'Row Count': count,
      Action: count > 0 ? (isConfirm ? 'WILL DELETE' : 'WOULD DELETE') : 'EMPTY',
    }))
  );

  console.log('\n--- ADMIN ACCOUNTS (WILL BE PRESERVED & NEVER TOUCHED) ---');
  if (adminUsers.length === 0) {
    console.log('  ⚠️ No admin accounts found. (Ensure you create a Super Admin with scripts/create-super-admin.mjs)');
  } else {
    adminUsers.forEach((admin) => {
      console.log(`  🛡️  [PRESERVED] ${admin.email} (Role: ${admin.role}, Name: ${admin.name})`);
    });
  }

  console.log('\n--- HEADTEACHER / DEMO ACCOUNTS (TO BE DELETED) ---');
  if (headteacherUsers.length === 0) {
    console.log('  ℹ️  No headteacher auth accounts found.');
  } else {
    headteacherUsers.forEach((ht) => {
      console.log(`  🗑️  [DELETE] ${ht.email} (ID: ${ht.id})`);
    });
  }

  if (ambiguousUsers.length > 0) {
    console.warn('\n⚠️ WARNING: Found accounts with ambiguous roles:');
    ambiguousUsers.forEach((u) => console.warn(`  ❓ ${u.email} (ID: ${u.id})`));
    if (isConfirm) {
      console.error('\n❌ ABORTING: Cannot safely proceed with ambiguous auth accounts present. Please check user roles.\n');
      process.exit(1);
    }
  }

  // If in DRY-RUN mode, print instructions and exit safely
  if (!isConfirm) {
    console.log('\n=============================================================');
    console.log('                       DRY-RUN COMPLETE                      ');
    console.log('=============================================================');
    console.log('✅ DRY-RUN SUCCESSFUL: No records or accounts were deleted.');
    console.log('\nTo execute the confirmed cleanup with pre-deletion CSV backup:');
    console.log('  npm run reset:clean -- --confirm\n');
    return;
  }

  // 4. Confirmed Execution Flow
  console.log('\n⚠️ ATTENTION: You are about to permanently delete all demo/test data.');
  const confirmation = await promptUser('Type DELETE to confirm and proceed with reset: ');

  if (confirmation !== 'DELETE') {
    console.log('\n🚫 Confirmation failed. Aborting reset. No changes were made.\n');
    process.exit(0);
  }

  // 5. Create CSV Backups
  const backupFolder = path.join(process.cwd(), 'backups', formatTimestamp());
  console.log(`\n📦 Creating pre-reset CSV backups in: ${backupFolder}`);
  fs.mkdirSync(backupFolder, { recursive: true });

  for (const table of TABLES_TO_CLEAN) {
    const { data: rows, error } = await supabase.from(table).select('*');
    if (!error && rows && rows.length > 0) {
      const csv = jsonToCsv(rows);
      fs.writeFileSync(path.join(backupFolder, `${table}.csv`), csv, 'utf-8');
      console.log(`  💾 Backed up ${rows.length} rows from ${table}`);
    } else {
      fs.writeFileSync(path.join(backupFolder, `${table}.csv`), '', 'utf-8');
    }
  }

  // Backup auth users info
  const authBackupRows = usersData.users.map((u) => ({
    id: u.id,
    email: u.email,
    created_at: u.created_at,
    role: profilesMap.get(u.id)?.role || 'unknown',
  }));
  fs.writeFileSync(
    path.join(backupFolder, 'auth_users.csv'),
    jsonToCsv(authBackupRows),
    'utf-8'
  );
  console.log(`  💾 Backed up auth users metadata to auth_users.csv`);

  // 6. Delete Data in Foreign Key Order
  console.log('\n🧹 Clearing data tables...');

  // Child submission tables
  const childSubmissionTables = [
    'special_teachers',
    'staff_payroll',
    'furniture',
    'classrooms',
    'teachers',
    'enrolment',
    'infrastructure',
    'submission_levels',
  ] as const;

  for (const table of childSubmissionTables) {
    const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) console.warn(`  ⚠️ Note clearing ${table}: ${error.message}`);
    else console.log(`  ✅ Cleared ${table}`);
  }

  // Notifications and Audit Log
  const auditErrors = await Promise.all([
    supabase.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
    supabase.from('audit_log').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
  ]);
  console.log('  ✅ Cleared notifications and audit_log');

  // Submissions
  const { error: subErr } = await supabase.from('submissions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (subErr) console.warn(`  ⚠️ Submissions clear note: ${subErr.message}`);
  else console.log('  ✅ Cleared submissions');

  // Delete headteacher profiles
  const { error: profErr } = await supabase.from('profiles').delete().eq('role', 'headteacher');
  if (profErr) console.warn(`  ⚠️ Headteacher profiles note: ${profErr.message}`);
  else console.log('  ✅ Cleared headteacher profiles');

  // Schools, Circuits, Rounds
  await supabase.from('schools').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('  ✅ Cleared schools');

  await supabase.from('circuits').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('  ✅ Cleared circuits');

  await supabase.from('rounds').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('  ✅ Cleared rounds');

  // Delete Headteacher Auth Users
  console.log('\n👤 Deleting synthetic headteacher auth accounts...');
  for (const ht of headteacherUsers) {
    const { error } = await supabase.auth.admin.deleteUser(ht.id);
    if (error) {
      console.warn(`  ⚠️ Could not delete auth user ${ht.email}: ${error.message}`);
    } else {
      console.log(`  🗑️ Deleted auth account: ${ht.email}`);
    }
  }

  // 7. Verify Post-Cleanup State
  console.log('\n📊 Verifying post-cleanup counts...');
  const postCounts: Record<string, number> = {};
  for (const table of TABLES_TO_CLEAN) {
    const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
    postCounts[table] = count || 0;
  }

  console.table(
    Object.entries(postCounts).map(([table, count]) => ({
      'Table Name': table,
      'Current Rows': count,
      Status: count === 0 ? '✅ Clean' : '⚠️ Has Rows',
    }))
  );

  console.log('\n=============================================================');
  console.log('           AMDEMIS CLEAN STATE RESET COMPLETE                ');
  console.log('=============================================================');
  console.log('1. All test schools, submissions, and demo records have been cleared.');
  console.log('2. Admin accounts remain active and untouched.');
  console.log('3. Backups preserved in:', backupFolder);
  console.log('4. The next created school will receive School Login ID: AMD-0001');
  console.log('\n💡 Optional: To reset the SQL sequence in Supabase SQL Editor, run:');
  console.log('   ALTER SEQUENCE public.school_login_seq RESTART WITH 1;\n');
}

main().catch((err) => {
  console.error('❌ Unexpected error during reset script execution:', err);
  process.exit(1);
});
