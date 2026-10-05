import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generatePin } from '@/lib/utils';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { school_id } = await request.json();

    if (!school_id) {
      return NextResponse.json({ error: 'School ID is required' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // 1. Get school info
    const { data: school, error: schoolError } = await adminClient
      .from('schools')
      .select('*, circuits(name)')
      .eq('id', school_id)
      .single();

    if (schoolError || !school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    // 2. Generate new PIN
    const newPin = generatePin();
    const syntheticEmail = `${school.school_login_id.toLowerCase()}@amdemis.local`;

    // 3. Find or recreate auth user
    const { data: userList } = await adminClient.auth.admin.listUsers();
    const existingUser = userList?.users?.find(
      (u) => u.email?.toLowerCase() === syntheticEmail.toLowerCase()
    );

    let authUserId: string;

    if (existingUser) {
      authUserId = existingUser.id;
      const { error: passError } = await adminClient.auth.admin.updateUserById(
        authUserId,
        { password: newPin }
      );
      if (passError) {
        return NextResponse.json({ error: passError.message }, { status: 500 });
      }
    } else {
      const { data: created, error: createError } = await adminClient.auth.admin.createUser({
        email: syntheticEmail,
        password: newPin,
        email_confirm: true,
        user_metadata: { role: 'headteacher', school_id: school.id },
      });
      if (createError || !created.user) {
        return NextResponse.json({ error: createError?.message || 'Failed to create user' }, { status: 500 });
      }
      authUserId = created.user.id;
    }

    // 4. Update profile (force PIN change, clear failed attempts and lock)
    await adminClient.from('profiles').upsert({
      id: authUserId,
      role: 'headteacher',
      school_id: school.id,
      full_name: school.headteacher_name || 'Headteacher',
      is_initial_pin: true,
      failed_attempts: 0,
      locked_until: null,
      updated_at: new Date().toISOString(),
    });

    // 5. Audit Log
    const supabase = await createClient();
    const { data: currentUser } = await supabase.auth.getUser();

    await adminClient.from('audit_log').insert({
      user_id: currentUser.user?.id || null,
      action: 'RESET_SCHOOL_PIN',
      target_type: 'school',
      target_id: school.id,
      details: {
        school_name: school.name,
        school_login_id: school.school_login_id,
      },
    });

    return NextResponse.json({
      success: true,
      school_id: school.id,
      school_name: school.name,
      school_login_id: school.school_login_id,
      circuit_name: school.circuits?.name || 'Circuit',
      pin: newPin,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
