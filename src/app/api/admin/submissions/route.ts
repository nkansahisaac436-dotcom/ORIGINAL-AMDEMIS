import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const roundId = searchParams.get('round_id');
    const circuitId = searchParams.get('circuit_id');
    const status = searchParams.get('status');
    const submissionId = searchParams.get('id');

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );

    // Single submission drill-down
    if (submissionId) {
      const { data: sub, error } = await supabase
        .from('submissions')
        .select(`
          *,
          schools(*, circuits(*)),
          rounds(*),
          submission_levels(level),
          enrolment(*),
          teachers(*),
          classrooms(*),
          furniture(*),
          staff_payroll(*),
          special_teachers(*),
          infrastructure(*)
        `)
        .eq('id', submissionId)
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json(sub);
    }

    // List submissions
    let query = supabase
      .from('submissions')
      .select(`
        *,
        schools(id, name, status, school_login_id, emis_code, circuit_id, circuits(id, name)),
        rounds(id, title),
        submission_levels(level)
      `)
      .order('updated_at', { ascending: false });

    if (roundId) {
      query = query.eq('round_id', roundId);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data: submissions, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let result = submissions || [];
    if (circuitId) {
      result = result.filter((s: any) => s.schools?.circuit_id === circuitId);
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
