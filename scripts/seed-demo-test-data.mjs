// AMDEMIS Demo Test Seed Script
// Run via: node scripts/seed-demo-test-data.mjs

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in your .env or .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function seedTestData() {
  console.log('🚀 Seeding AMDEMIS Test Credentials & Demo Environment...\n');

  // 1. Create Super Admin
  const adminEmail = 'admin@amdemis.gov.gh';
  const adminPassword = 'DistrictAdmin2026!';
  const adminName = 'Directorate Planning Officer';

  console.log(`1. Setting up Admin Account: ${adminEmail}`);
  const { data: userList } = await supabase.auth.admin.listUsers();
  const existingAdmin = userList?.users?.find(u => u.email?.toLowerCase() === adminEmail.toLowerCase());

  let adminId;
  if (existingAdmin) {
    adminId = existingAdmin.id;
    await supabase.auth.admin.updateUserById(adminId, { password: adminPassword });
  } else {
    const { data: newAdmin, error: adminErr } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: { full_name: adminName, role: 'super_admin' },
    });
    if (adminErr) throw adminErr;
    adminId = newAdmin.user.id;
  }

  await supabase.from('profiles').upsert({
    id: adminId,
    role: 'super_admin',
    full_name: adminName,
    is_initial_pin: false,
    failed_attempts: 0,
    updated_at: new Date().toISOString(),
  });

  // 2. Create Sample Circuits
  console.log('2. Creating Sample Circuits...');
  const circuits = [
    { name: 'Nyinahin Circuit', officer_name: 'Mr. Kwame Mensah', officer_phone: '0244123456' },
    { name: 'Mpasatia Circuit', officer_name: 'Mrs. Abena Serwaa', officer_phone: '0244654321' },
    { name: 'Tanodumase Circuit', officer_name: 'Mr. Kofi Boateng', officer_phone: '0244789012' },
  ];

  const createdCircuits = [];
  for (const c of circuits) {
    const { data: circ, error: circErr } = await supabase
      .from('circuits')
      .upsert({ name: c.name, officer_name: c.officer_name, officer_phone: c.officer_phone, is_active: true }, { onConflict: 'name' })
      .select('id, name')
      .single();
    if (!circErr && circ) {
      createdCircuits.push(circ);
    }
  }

  // 3. Create Active Collection Round
  console.log('3. Opening 2026/2027 Annual Collection Round...');
  const { data: activeRound } = await supabase
    .from('rounds')
    .upsert({
      title: '2026/2027 Academic Year Annual Census',
      instruction_text: 'Please complete all school enrolments, teacher counts, and infrastructure statistics before the deadline.',
      opening_date: '2026-09-01',
      deadline: '2026-11-30',
      is_active: true,
    }, { onConflict: 'title' })
    .select('id, title')
    .single();

  // 4. Create Headteacher Test Schools & Credentials
  console.log('4. Provisioning Test Schools & Headteacher Accounts...');
  const testSchools = [
    {
      name: 'Nyinahin Catholic Basic School',
      status: 'public',
      circuit_id: createdCircuits[0]?.id,
      town: 'Nyinahin',
      emis_code: '201042001',
      levels: ['kg', 'primary', 'jhs'],
      headteacher_name: 'Mr. Emmanuel Osei',
      headteacher_phone: '0244998877',
      login_id: 'AMD-0001',
      pin: '123456',
    },
    {
      name: 'Mpasatia D/A JHS',
      status: 'public',
      circuit_id: createdCircuits[1]?.id,
      town: 'Mpasatia',
      emis_code: '201042002',
      levels: ['jhs'],
      headteacher_name: 'Madam Akua Afriyie',
      headteacher_phone: '0244556677',
      login_id: 'AMD-0002',
      pin: '654321',
    },
  ];

  for (const sch of testSchools) {
    // Insert/update school
    const { data: schoolRecord } = await supabase
      .from('schools')
      .upsert({
        name: sch.name,
        status: sch.status,
        circuit_id: sch.circuit_id,
        town: sch.town,
        emis_code: sch.emis_code,
        levels: sch.levels,
        headteacher_name: sch.headteacher_name,
        headteacher_phone: sch.headteacher_phone,
        school_login_id: sch.login_id,
        is_active: true,
      }, { onConflict: 'school_login_id' })
      .select('id, name, school_login_id')
      .single();

    if (schoolRecord) {
      // Create headteacher synthetic auth account
      const syntheticEmail = `${sch.login_id.toLowerCase()}@amdemis.local`;
      const existingHT = userList?.users?.find(u => u.email?.toLowerCase() === syntheticEmail);

      let htUserId;
      if (existingHT) {
        htUserId = existingHT.id;
        await supabase.auth.admin.updateUserById(htUserId, { password: sch.pin });
      } else {
        const { data: newHT } = await supabase.auth.admin.createUser({
          email: syntheticEmail,
          password: sch.pin,
          email_confirm: true,
          user_metadata: { full_name: sch.headteacher_name, role: 'headteacher', school_id: schoolRecord.id },
        });
        htUserId = newHT?.user?.id;
      }

      if (htUserId) {
        await supabase.from('profiles').upsert({
          id: htUserId,
          role: 'headteacher',
          school_id: schoolRecord.id,
          full_name: sch.headteacher_name,
          is_initial_pin: false,
          failed_attempts: 0,
          updated_at: new Date().toISOString(),
        });
      }
    }
  }

  console.log('\n========================================');
  console.log('✅ AMDEMIS TEST LOGINS READY FOR USE:');
  console.log('========================================\n');
  console.log('👑 1. ADMIN DIRECTORE LOGINS:');
  console.log('   • Email: admin@amdemis.gov.gh');
  console.log('   • Password: DistrictAdmin2026!\n');
  console.log('🏫 2. HEADTEACHER TEST LOGINS:');
  console.log('   • School: Nyinahin Catholic Basic School (KG, Primary, JHS)');
  console.log('     - School Login ID: AMD-0001');
  console.log('     - 6-Digit PIN: 123456\n');
  console.log('   • School: Mpasatia D/A JHS (JHS Only)');
  console.log('     - School Login ID: AMD-0002');
  console.log('     - 6-Digit PIN: 654321\n');
  console.log('========================================\n');
}

seedTestData().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});
