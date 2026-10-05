import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminLoginSchema } from '@/lib/schemas/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = adminLoginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Please enter a valid email and password.' },
        { status: 400 }
      );
    }

    const { email, password } = result.data;
    const supabase = await createClient();

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: 'Wrong email or password.' },
        { status: 401 }
      );
    }

    // Check that user is an admin or officer
    const { data: profile, error: profError } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', authData.user.id)
      .single();

    if (
      profError ||
      !profile ||
      (profile.role !== 'super_admin' && profile.role !== 'district_officer')
    ) {
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: 'Access denied. For Directorate administrators and district officers only.' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      role: profile.role,
      redirect: '/admin/dashboard',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
