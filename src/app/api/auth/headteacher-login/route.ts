import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { headteacherLoginSchema } from '@/lib/schemas/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { memorySchools, memoryCredentials } from '@/lib/memory-store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = headteacherLoginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input format. Check your School Login ID and PIN.' },
        { status: 400 }
      );
    }

    const { school_login_id, pin } = result.data;
    const cleanId = school_login_id.trim().toUpperCase();
    const syntheticEmail = `${cleanId.toLowerCase()}@amdemis.local`;

    // 0. Check memory credentials store first
    const memCred = memoryCredentials.get(cleanId);
    if (memCred) {
      if (memCred.locked_until && new Date(memCred.locked_until) > new Date()) {
        const remainingMinutes = Math.ceil(
          (new Date(memCred.locked_until).getTime() - Date.now()) / (60 * 1000)
        );
        return NextResponse.json(
          {
            error: `Too many attempts. Try again in ${remainingMinutes || 15} minutes or ask the Planning & Statistics Unit.`,
          },
          { status: 429 }
        );
      }

      if (memCred.pin_hash !== pin) {
        memCred.failed_attempts += 1;
        if (memCred.failed_attempts >= 5) {
          memCred.locked_until = new Date(Date.now() + 15 * 60 * 1000).toISOString();
          return NextResponse.json(
            {
              error:
                'Too many attempts. Try again in 15 minutes or ask the Planning & Statistics Unit.',
            },
            { status: 429 }
          );
        }
        return NextResponse.json(
          { error: 'Wrong School Login ID or PIN. Check your slip and try again.' },
          { status: 401 }
        );
      }

      // Success
      memCred.failed_attempts = 0;
      memCred.locked_until = null;

      let schoolId: string | null = null;
      for (const s of memorySchools.values()) {
        if (s.school_login_id.toUpperCase() === cleanId) {
          schoolId = s.id;
          break;
        }
      }

      const response = NextResponse.json({
        success: true,
        role: 'headteacher',
        is_initial_pin: memCred.is_initial_pin,
        school_id: schoolId,
        redirect: '/headteacher/dashboard',
      });

      response.cookies.set('amdemis_headteacher_session', cleanId, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7,
        sameSite: 'lax',
      });

      return response;
    }

    let adminClient;
    try {
      adminClient = createAdminClient();
    } catch {
      // Fallback
    }

    // 1. Check if user exists & if account is locked
    let existingUser: any = null;
    let existingProfile: any = null;

    if (adminClient) {
      const { data: userList } = await adminClient.auth.admin.listUsers();
      existingUser = userList?.users?.find(
        (u) => u.email?.toLowerCase() === syntheticEmail.toLowerCase()
      );

      if (existingUser) {
        const { data: profile } = await adminClient
          .from('profiles')
          .select('id, failed_attempts, locked_until, is_initial_pin, school_id')
          .eq('id', existingUser.id)
          .maybeSingle();

        existingProfile = profile;

        if (profile?.locked_until && new Date(profile.locked_until) > new Date()) {
          const remainingMinutes = Math.ceil(
            (new Date(profile.locked_until).getTime() - Date.now()) / (60 * 1000)
          );
          return NextResponse.json(
            {
              error: `Too many attempts. Try again in ${remainingMinutes || 15} minutes or ask the Planning & Statistics Unit.`,
            },
            { status: 429 }
          );
        }
      }
    }

    // 2. Attempt authentication with Supabase
    const supabase = await createClient();
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: syntheticEmail,
        password: pin,
      });

    // 3. Handle Failed Login (Wrong PIN or no account)
    if (authError || !authData.user) {
      if (adminClient && existingUser) {
        const currentAttempts = (existingProfile?.failed_attempts || 0) + 1;
        const willLock = currentAttempts >= 5;
        const lockedUntil = willLock
          ? new Date(Date.now() + 15 * 60 * 1000).toISOString()
          : null;

        await adminClient
          .from('profiles')
          .update({
            failed_attempts: currentAttempts,
            locked_until: lockedUntil,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingUser.id);

        if (willLock) {
          return NextResponse.json(
            {
              error:
                'Too many attempts. Try again in 15 minutes or ask the Planning & Statistics Unit.',
            },
            { status: 429 }
          );
        }
      }

      return NextResponse.json(
        { error: 'Wrong School Login ID or PIN. Check your slip and try again.' },
        { status: 401 }
      );
    }

    // 4. Successful Login: Clear failed attempts and unlock
    if (adminClient && existingUser) {
      await adminClient
        .from('profiles')
        .update({
          failed_attempts: 0,
          locked_until: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', authData.user.id);
    }

    // 5. Query user profile for initial PIN status
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_initial_pin, school_id')
      .eq('id', authData.user.id)
      .maybeSingle();

    const isInitialPin = profile?.is_initial_pin ?? true;

    const response = NextResponse.json({
      success: true,
      role: 'headteacher',
      is_initial_pin: isInitialPin,
      school_id: profile?.school_id || null,
      redirect: '/headteacher/dashboard',
    });

    response.cookies.set('amdemis_headteacher_session', cleanId, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
