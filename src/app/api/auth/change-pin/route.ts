import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { changePinSchema } from '@/lib/schemas/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { validateNewPin, verifyHeadteacherRole } from '@/lib/auth-helpers';
import { cookies } from 'next/headers';
import { memoryCredentials } from '@/lib/memory-store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = changePinSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || 'Invalid PIN format' },
        { status: 400 }
      );
    }

    const { current_pin, new_pin, confirm_pin } = result.data;

    // Validate weak PIN rules
    const pinCheck = validateNewPin(new_pin, current_pin);
    if (!pinCheck.isValid) {
      return NextResponse.json({ error: pinCheck.error }, { status: 400 });
    }

    if (new_pin !== confirm_pin) {
      return NextResponse.json({ error: 'PINs do not match.' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const htCookie = cookieStore.get('amdemis_headteacher_session')?.value;
    
    // Check memory store credentials
    if (htCookie) {
      const schoolLoginId = htCookie.trim().toUpperCase();
      const memCred = memoryCredentials.get(schoolLoginId);
      if (memCred) {
        if (memCred.pin_hash !== current_pin) {
          return NextResponse.json(
            { error: 'Current PIN is incorrect. Please check your credentials.' },
            { status: 401 }
          );
        }
        memCred.pin_hash = new_pin;
        memCred.is_initial_pin = false;
        memCred.failed_attempts = 0;
        memCred.locked_until = null;
        return NextResponse.json({
          success: true,
          message: 'PIN successfully changed.',
        });
      }
    }

    let adminClient: any = null;
    try {
      adminClient = createAdminClient();
    } catch {
      // Fallback
    }

    let targetUserId: string | null = null;
    let syntheticEmail: string | null = null;
    let schoolLoginId: string | null = null;

    if (htCookie && adminClient) {
      schoolLoginId = htCookie.trim().toUpperCase();
      syntheticEmail = `${schoolLoginId.toLowerCase()}@amdemis.local`;
      const { data: userList } = await adminClient.auth.admin.listUsers();
      const existingUser = userList?.users?.find(
        (u: any) => u.email?.toLowerCase() === syntheticEmail?.toLowerCase()
      );
      if (existingUser) {
        targetUserId = existingUser.id;
      }
    } else {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        targetUserId = user.id;
        syntheticEmail = user.email || null;
      }
    }

    if (!targetUserId || !syntheticEmail) {
      return NextResponse.json({ error: 'Unauthorized: Session not found.' }, { status: 401 });
    }

    // Verify current PIN by attempting signIn or checking
    const supabase = await createClient();
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: syntheticEmail,
      password: current_pin,
    });

    if (signInErr) {
      return NextResponse.json(
        { error: 'Current PIN is incorrect. Please check your credentials.' },
        { status: 401 }
      );
    }

    // Update password in Supabase Auth
    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      targetUserId,
      { password: new_pin }
    );

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Mark profile as not initial PIN
    await adminClient
      .from('profiles')
      .update({
        is_initial_pin: false,
        failed_attempts: 0,
        locked_until: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', targetUserId);

    // Audit log (Never logging the plain PIN)
    await adminClient.from('audit_log').insert({
      user_id: targetUserId,
      action: 'HEADTEACHER_CHANGE_PIN',
      target_type: 'user',
      target_id: targetUserId,
      details: {
        school_login_id: schoolLoginId,
        changed_at: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'PIN successfully changed.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
