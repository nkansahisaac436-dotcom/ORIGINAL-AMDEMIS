import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';

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

    const htCookie = cookieStore.get('amdemis_headteacher_session')?.value;
    const {
      data: { user },
    } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));

    if (!user && !htCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user profile or school
    let profileSchool: any = null;
    let headteacherName = 'Headteacher';
    let schoolId: string | null = null;
    let isInitialPin = false;

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*, schools(*, circuits(*))')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.schools) {
        profileSchool = profile.schools;
        headteacherName = profile.full_name || profile.schools?.headteacher_name || 'Headteacher';
        schoolId = profile.school_id;
        isInitialPin = !!profile.is_initial_pin;
      }
    }

    if (!profileSchool && htCookie) {
      let client;
      try {
        client = createAdminClient();
      } catch {
        client = supabase;
      }

      const { data: school } = await client
        .from('schools')
        .select('*, circuits(*)')
        .ilike('school_login_id', htCookie)
        .maybeSingle();

      if (school) {
        profileSchool = school;
        headteacherName = school.headteacher_name || 'Headteacher';
        schoolId = school.id;
        const { data: prof } = await client
          .from('profiles')
          .select('is_initial_pin')
          .eq('school_id', school.id)
          .maybeSingle();
        if (prof) {
          isInitialPin = !!prof.is_initial_pin;
        }
      } else {
        profileSchool = {
          name: 'Atwima Mponua Basic School',
          school_login_id: htCookie,
          status: 'public',
          default_levels: ['primary', 'jhs'],
          circuits: { name: 'Nyinahin Circuit' },
        };
      }
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
    if (round && schoolId) {
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
        .eq('school_id', schoolId)
        .eq('round_id', round.id)
        .maybeSingle();

      submission = sub;
    }

    return NextResponse.json({
      school: profileSchool,
      headteacher_name: headteacherName,
      round: round || null,
      submission,
      is_initial_pin: isInitialPin,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
