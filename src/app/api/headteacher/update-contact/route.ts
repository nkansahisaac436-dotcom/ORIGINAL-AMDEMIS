import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const {
      headteacher_name,
      headteacher_phone,
      assistant_headteacher_name,
      assistant_headteacher_phone,
    } = await request.json();

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('school_id')
      .eq('id', user.id)
      .single();

    if (!profile?.school_id) {
      return NextResponse.json({ error: 'No school profile linked' }, { status: 403 });
    }

    const adminClient = createAdminClient();

    // Update school contact records
    await adminClient
      .from('schools')
      .update({
        headteacher_name,
        headteacher_phone,
        assistant_headteacher_name,
        assistant_headteacher_phone,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.school_id);

    // Update profile name & phone
    await adminClient
      .from('profiles')
      .update({
        full_name: headteacher_name,
        phone: headteacher_phone,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
