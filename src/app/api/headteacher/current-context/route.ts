import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*, schools(*, circuits(*))')
      .eq('id', user.id)
      .single();

    if (!profile || !profile.school_id) {
      return NextResponse.json(
        { error: 'User is not assigned to any school profile' },
        { status: 403 }
      );
    }

    // Fetch active collection round
    const { data: round } = await supabase
      .from('rounds')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Fetch existing submission for this school and round
    let submission = null;
    if (round) {
      const { data: sub } = await supabase
        .from('submissions')
        .select(`
          *,
          submission_levels(level),
          enrolment(*),
          teachers(*),
          classrooms(*),
          furniture(*),
          staff_payroll(*),
          special_teachers(*),
          infrastructure(*)
        `)
        .eq('school_id', profile.school_id)
        .eq('round_id', round.id)
        .maybeSingle();

      submission = sub;
    }

    return NextResponse.json({
      school: profile.schools,
      headteacher_name: profile.full_name || profile.schools?.headteacher_name || 'Headteacher',
      round: round || null,
      submission,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
