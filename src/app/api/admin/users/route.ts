import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: myProf } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user?.id || '')
      .single();

    if (myProf?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Super Admin privileges required' }, { status: 403 });
    }

    const adminClient = createAdminClient();
    const { data: userList } = await adminClient.auth.admin.listUsers();
    const { data: profiles } = await adminClient
      .from('profiles')
      .select('*')
      .in('role', ['super_admin', 'district_officer'])
      .order('created_at', { ascending: false });

    const result = profiles?.map((p) => {
      const u = userList?.users?.find((usr) => usr.id === p.id);
      return {
        ...p,
        email: u?.email || 'N/A',
      };
    });

    return NextResponse.json(result || []);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, full_name, role } = await request.json();

    if (!email || !password || !role) {
      return NextResponse.json({ error: 'Email, password, and role are required' }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: myProf } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user?.id || '')
      .single();

    if (myProf?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Super Admin privileges required' }, { status: 403 });
    }

    const adminClient = createAdminClient();

    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: { full_name, role },
    });

    if (createError || !newUser.user) {
      return NextResponse.json({ error: createError?.message || 'Error creating user' }, { status: 500 });
    }

    await adminClient.from('profiles').upsert({
      id: newUser.user.id,
      role,
      full_name,
      is_initial_pin: false,
      failed_attempts: 0,
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      user: { id: newUser.user.id, email, full_name, role },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
