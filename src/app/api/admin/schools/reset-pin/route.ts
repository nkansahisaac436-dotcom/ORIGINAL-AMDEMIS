import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateSecurePin, verifyAdminRole } from '@/lib/auth-helpers';
import { memorySchools, memoryCredentials } from '@/lib/memory-store';

export async function POST(request: NextRequest) {
  try {
    const adminAuth = await verifyAdminRole();
    if (!adminAuth.isAdmin) {
      return NextResponse.json({ error: adminAuth.error || 'Admin access required' }, { status: 403 });
    }

    const { school_id } = await request.json();

    if (!school_id) {
      return NextResponse.json({ error: 'School ID is required' }, { status: 400 });
    }

    let adminClient: any = null;
    try {
      adminClient = createAdminClient();
    } catch {
      // Fallback
    }

    // 1. Get school info (DB or memory)
    let school: any = null;
    if (adminClient) {
      const { data: dbSchool } = await adminClient
        .from('schools')
        .select('*, circuits(name)')
        .eq('id', school_id)
        .maybeSingle();
      if (dbSchool) school = dbSchool;
    }

    if (!school) {
      const memSchool = memorySchools.get(school_id);
      if (memSchool) school = memSchool;
    }

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    // 2. Generate secure random 6-digit PIN
    const newPin = generateSecurePin();
    const syntheticEmail = `${school.school_login_id.toLowerCase()}@amdemis.local`;

    // 3. Find or recreate auth user if adminClient is available
    if (adminClient) {
      try {
        const { data: userList } = await adminClient.auth.admin.listUsers();
        const existingUser = userList?.users?.find(
          (u: any) => u.email?.toLowerCase() === syntheticEmail.toLowerCase()
        );

        let authUserId: string;

        if (existingUser) {
          authUserId = existingUser.id;
          await adminClient.auth.admin.updateUserById(authUserId, { password: newPin });
        } else {
          const { data: created } = await adminClient.auth.admin.createUser({
            email: syntheticEmail,
            password: newPin,
            email_confirm: true,
            user_metadata: { role: 'headteacher', school_id: school.id },
          });
          if (created?.user) {
            authUserId = created.user.id;
          }
        }

        // Update profile
        if (authUserId!) {
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
        }
      } catch {
        // Fallback handled below
      }
    }

    // 4. Update memory credentials (forced PIN change, cleared lock, cleared failed attempts)
    memoryCredentials.set(school.school_login_id.toUpperCase(), {
      school_login_id: school.school_login_id.toUpperCase(),
      pin_hash: newPin,
      is_initial_pin: true,
      failed_attempts: 0,
      locked_until: null,
    });

    // 5. Audit Log (Never storing the plain PIN)
    try {
      if (adminClient) {
        await adminClient.from('audit_log').insert({
          user_id: adminAuth.userId || null,
          action: 'RESET_SCHOOL_PIN',
          target_type: 'school',
          target_id: school.id,
          details: {
            school_name: school.name,
            school_login_id: school.school_login_id,
            circuit_name: school.circuits?.name,
            reset_by: adminAuth.userId,
          },
        });
      }
    } catch {
      // Ignore
    }

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
