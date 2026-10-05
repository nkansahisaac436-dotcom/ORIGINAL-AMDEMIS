import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { headteacherLoginSchema } from '@/lib/schemas/auth';
import { createAdminClient } from '@/lib/supabase/admin';

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
    const syntheticEmail = `${school_login_id.toLowerCase()}@amdemis.local`;

    // Check rate limiting / lock with service role client
    let adminClient;
    try {
      adminClient = createAdminClient();
    } catch {
      // Fallback
    }

    if (adminClient) {
      const { data: userList } = await adminClient.auth.admin.listUsers();
      const existingUser = userList?.users?.find(
        (u) => u.email?.toLowerCase() === syntheticEmail.toLowerCase()
      );

      if (existingUser) {
        const { data: profile } = await adminClient
          .from('profiles')
          .select('id, failed_attempts, locked_until')
          .eq('id', existingUser.id)
          .maybeSingle();

        if (profile?.locked_until && new Date(profile.locked_until) > new Date()) {
          return NextResponse.json(
            {
              error:
                'Too many attempts. Try again in 15 minutes or ask the Planning & Statistics Unit.',
            },
            { status: 429 }
          );
        }
      }
    }

    const supabase = await createClient();

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: syntheticEmail,
        password: pin,
      });

    if (authError || !authData.user) {
      // Record failed attempt
      if (adminClient) {
        const { data: userList } = await adminClient.auth.admin.listUsers();
        const existing = userList?.users?.find(
          (u) => u.email?.toLowerCase() === syntheticEmail.toLowerCase()
        );
        if (existing) {
          const { data: prof } = await adminClient
            .from('profiles')
            .select('failed_attempts')
            .eq('id', existing.id)
            .maybeSingle();

          const attempts = (prof?.failed_attempts || 0) + 1;
          const lockedUntil =
            attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null;

          await adminClient
            .from('profiles')
            .update({
              failed_attempts: attempts,
              locked_until: lockedUntil,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);

          if (attempts >= 5) {
            return NextResponse.json(
              {
                error:
                  'Too many attempts. Try again in 15 minutes or ask the Planning & Statistics Unit.',
              },
              { status: 429 }
            );
          }
        }
      }

      return NextResponse.json(
        { error: 'Wrong School Login ID or PIN. Check your slip and try again.' },
        { status: 401 }
      );
    }

    // Reset failed attempts on success
    if (adminClient) {
      await adminClient
        .from('profiles')
        .update({
          failed_attempts: 0,
          locked_until: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', authData.user.id);
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_initial_pin, school_id')
      .eq('id', authData.user.id)
      .single();

    return NextResponse.json({
      success: true,
      role: profile?.role || 'headteacher',
      is_initial_pin: profile?.is_initial_pin ?? false,
      redirect: '/headteacher/dashboard',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
