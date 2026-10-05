import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { schoolSchema } from '@/lib/schemas/school';
import { createAdminClient } from '@/lib/supabase/admin';
import { generatePin } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search')?.toLowerCase() || '';
    const circuitId = searchParams.get('circuit_id') || '';
    const status = searchParams.get('status') || '';
    const level = searchParams.get('level') || '';

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

    // Get active round
    const { data: activeRound } = await supabase
      .from('rounds')
      .select('id')
      .eq('is_active', true)
      .maybeSingle();

    let query = supabase
      .from('schools')
      .select(`
        *,
        circuits(id, name),
        submissions(id, round_id, status, submitted_at)
      `)
      .order('name', { ascending: true });

    if (circuitId) {
      query = query.eq('circuit_id', circuitId);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data: schools, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let filtered = schools || [];

    if (search) {
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(search) ||
          s.school_login_id.toLowerCase().includes(search) ||
          (s.emis_code && s.emis_code.toLowerCase().includes(search)) ||
          (s.town && s.town.toLowerCase().includes(search))
      );
    }

    if (level) {
      filtered = filtered.filter((s) => s.default_levels?.includes(level));
    }

    // Attach active submission status
    const result = filtered.map((s) => {
      const activeSub = activeRound
        ? s.submissions?.find((sub: any) => sub.round_id === activeRound.id)
        : null;

      return {
        ...s,
        submission_status: activeSub?.status || 'not_started',
        submitted_at: activeSub?.submitted_at || null,
      };
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = schoolSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0]?.message }, { status: 400 });
    }

    const schoolData = result.data;
    const adminClient = createAdminClient();

    // 1. Get next sequence / count for AMD-XXXX
    const { count } = await adminClient
      .from('schools')
      .select('*', { count: 'exact', head: true });

    const nextIdNumber = (count || 0) + 1;
    const loginId = `AMD-${String(nextIdNumber).padStart(4, '0')}`;
    const generatedPin = generatePin();
    const syntheticEmail = `${loginId.toLowerCase()}@amdemis.local`;

    // 2. Create school record
    const { data: newSchool, error: schoolError } = await adminClient
      .from('schools')
      .insert({
        name: schoolData.name.trim(),
        status: schoolData.status,
        circuit_id: schoolData.circuit_id,
        school_login_id: loginId,
        emis_code: schoolData.emis_code || null,
        town: schoolData.town || null,
        default_levels: schoolData.default_levels,
        headteacher_name: schoolData.headteacher_name || null,
        headteacher_phone: schoolData.headteacher_phone || null,
        assistant_headteacher_name: schoolData.assistant_headteacher_name || null,
        assistant_headteacher_phone: schoolData.assistant_headteacher_phone || null,
        is_active: schoolData.is_active,
        updated_at: new Date().toISOString(),
      })
      .select('*, circuits(name)')
      .single();

    if (schoolError || !newSchool) {
      return NextResponse.json({ error: schoolError?.message || 'Failed to create school' }, { status: 500 });
    }

    // 3. Create Supabase Auth User for School Headteacher
    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
      email: syntheticEmail,
      password: generatedPin,
      email_confirm: true,
      user_metadata: {
        role: 'headteacher',
        school_id: newSchool.id,
        school_name: newSchool.name,
      },
    });

    if (authError || !authUser.user) {
      return NextResponse.json({ error: authError?.message || 'Failed to create auth user' }, { status: 500 });
    }

    // 4. Create profile record
    await adminClient.from('profiles').insert({
      id: authUser.user.id,
      role: 'headteacher',
      school_id: newSchool.id,
      full_name: schoolData.headteacher_name || 'Headteacher',
      phone: schoolData.headteacher_phone || null,
      is_initial_pin: true,
      failed_attempts: 0,
      updated_at: new Date().toISOString(),
    });

    // 5. Audit Log
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
    const { data: currentUser } = await supabase.auth.getUser();

    await adminClient.from('audit_log').insert({
      user_id: currentUser.user?.id || null,
      action: 'CREATE_SCHOOL',
      target_type: 'school',
      target_id: newSchool.id,
      details: {
        name: newSchool.name,
        school_login_id: loginId,
        circuit_id: newSchool.circuit_id,
      },
    });

    return NextResponse.json({
      school: newSchool,
      credentials: {
        school_login_id: loginId,
        pin: generatedPin,
        school_name: newSchool.name,
        circuit_name: newSchool.circuits?.name || 'Circuit',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'School ID is required' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    const { data: updated, error } = await adminClient
      .from('schools')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*, circuits(name)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Audit Log
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
    const { data: currentUser } = await supabase.auth.getUser();

    await adminClient.from('audit_log').insert({
      user_id: currentUser.user?.id || null,
      action: 'UPDATE_SCHOOL',
      target_type: 'school',
      target_id: id,
      details: updates,
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
