// AMDEMIS Super Admin Bootstrap Script
// Run via: node scripts/create-super-admin.mjs admin@amdemis.local SuperPassword123! "District Director"

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

function loadEnvFile(fileName) {
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
  console.error('\n❌ ERROR: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in your .env.local file.\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function createSuperAdmin() {
  const email = process.argv[2] || 'admin@amdemis.local';
  const password = process.argv[3] || 'DistrictAdmin2026!';
  const fullName = process.argv[4] || 'District Director / Super Admin';

  console.log(`Creating Super Admin: ${email}...`);

  // Check if user already exists
  const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('Error querying auth users:', listError.message);
    process.exit(1);
  }

  const existing = existingUsers.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

  let userId;
  if (existing) {
    console.log(`User ${email} already exists. Updating password and super_admin profile...`);
    userId = existing.id;
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, { password });
    if (updateError) {
      console.error('Error updating user password:', updateError.message);
      process.exit(1);
    }
  } else {
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role: 'super_admin' },
    });
    if (createError) {
      console.error('Error creating user:', createError.message);
      process.exit(1);
    }
    userId = newUser.user.id;
  }

  // Upsert profile as super_admin
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: userId,
    role: 'super_admin',
    full_name: fullName,
    is_initial_pin: false,
    failed_attempts: 0,
    updated_at: new Date().toISOString(),
  });

  if (profileError) {
    console.error('Error setting profile role:', profileError.message);
    process.exit(1);
  }

  console.log(`\n Successfully created Super Admin!`);
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log(`Role: super_admin`);
}

createSuperAdmin().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
