import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generatePin } from '@/lib/utils';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { circuit_id } = await request.json();

    if (!circuit_id) {
      return NextResponse.json({ error: 'Circuit ID is required' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // 1. Get all active schools in this circuit
    const { data: schools, error: schoolError } = await adminClient
      .from('schools')
      .select('*, circuits(name)')
      .eq('circuit_id', circuit_id)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (schoolError || !schools || schools.length === 0) {
      return NextResponse.json(
        { error: 'No active schools found in this circuit.' },
        { status: 404 }
      );
    }

    const { data: userList } = await adminClient.auth.admin.listUsers();
    const pinSlips = [];

    for (const school of schools) {
      const newPin = generatePin();
      const syntheticEmail = `${school.school_login_id.toLowerCase()}@amdemis.local`;
      const existing = userList?.users?.find(
        (u) => u.email?.toLowerCase() === syntheticEmail.toLowerCase()
      );

      let authUserId: string;
      if (existing) {
        authUserId = existing.id;
        await adminClient.auth.admin.updateUserById(authUserId, { password: newPin });
      } else {
        const { data: created } = await adminClient.auth.admin.createUser({
          email: syntheticEmail,
          password: newPin,
          email_confirm: true,
          user_metadata: { role: 'headteacher', school_id: school.id },
        });
        authUserId = created.user!.id;
      }

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

      pinSlips.push({
        school_id: school.id,
        school_name: school.name,
        school_login_id: school.school_login_id,
        circuit_name: school.circuits?.name || 'Circuit',
        emis_code: school.emis_code || 'N/A',
        pin: newPin,
      });
    }

    // Audit Log
    const supabase = await createClient();
    const { data: currentUser } = await supabase.auth.getUser();

    await adminClient.from('audit_log').insert({
      user_id: currentUser.user?.id || null,
      action: 'BULK_GENERATE_PINS',
      target_type: 'circuit',
      target_id: circuit_id,
      details: {
        circuit_name: schools[0]?.circuits?.name,
        schools_count: schools.length,
      },
    });

    return NextResponse.json({
      success: true,
      circuit_name: schools[0]?.circuits?.name || 'Circuit',
      slips: pinSlips,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
