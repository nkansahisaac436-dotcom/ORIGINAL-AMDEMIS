import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'master'; // 'master' | 'non_submitters' | 'circuits'

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

    const { data: activeRound } = await supabase
      .from('rounds')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: schools } = await supabase
      .from('schools')
      .select('*, circuits(name)')
      .eq('is_active', true)
      .order('name');

    const { data: submissions } = await supabase
      .from('submissions')
      .select('*')
      .eq('round_id', activeRound?.id || '00000000-0000-0000-0000-000000000000');

    const subMap = new Map<string, any>();
    submissions?.forEach((s) => subMap.set(s.school_id, s));

    let csvContent = '';
    let fileName = 'amdemis_export.csv';

    if (type === 'non_submitters') {
      fileName = 'amdemis_non_submitters.csv';
      const headers = ['School Name', 'Circuit', 'Status', 'Headteacher Name', 'Headteacher Phone', 'Progress'];
      const rows = (schools || [])
        .filter((s) => !subMap.has(s.id) || subMap.get(s.id).status !== 'submitted')
        .map((s) => {
          const sub = subMap.get(s.id);
          return [
            `"${s.name}"`,
            `"${s.circuits?.name || ''}"`,
            `"${s.status}"`,
            `"${s.headteacher_name || ''}"`,
            `"${s.headteacher_phone || ''}"`,
            `"${sub?.status === 'draft' ? 'Draft Saved' : 'Not Started'}"`,
          ].join(',');
        });

      csvContent = [headers.join(','), ...rows].join('\n');
    } else {
      fileName = 'amdemis_master_schools.csv';
      const headers = [
        'School Login ID',
        'School Name',
        'Circuit',
        'Status',
        'EMIS Code',
        'Town',
        'Submission Status',
        'Headteacher',
        'Phone',
        'Total Teachers',
        'Male Teachers',
        'Female Teachers',
      ];
      const rows = (schools || []).map((s) => {
        const sub = subMap.get(s.id);
        return [
          `"${s.school_login_id}"`,
          `"${s.name}"`,
          `"${s.circuits?.name || ''}"`,
          `"${s.status}"`,
          `"${s.emis_code || '1066329999'}"`,
          `"${s.town || ''}"`,
          `"${sub?.status ? sub.status.toUpperCase() : 'NOT STARTED'}"`,
          `"${sub?.headteacher_name || s.headteacher_name || ''}"`,
          `"${sub?.headteacher_phone || s.headteacher_phone || ''}"`,
          sub?.total_teachers || 0,
          sub?.male_teachers || 0,
          sub?.female_teachers || 0,
        ].join(',');
      });

      csvContent = [headers.join(','), ...rows].join('\n');
    }

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
