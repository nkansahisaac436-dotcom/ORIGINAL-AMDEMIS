import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const { submission_id, reason } = await request.json();

    if (!submission_id) {
      return NextResponse.json({ error: 'Submission ID is required' }, { status: 400 });
    }

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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const adminClient = createAdminClient();

    // 1. Update submission status to 'reopened'
    const { data: updatedSub, error: updateErr } = await adminClient
      .from('submissions')
      .update({
        status: 'reopened',
        reopened_at: new Date().toISOString(),
        reopened_by: user?.id || null,
        reopened_reason: reason || 'Reopened by Directorate Administrator for corrections',
        updated_at: new Date().toISOString(),
      })
      .eq('id', submission_id)
      .select('*, schools(name, id)')
      .single();

    if (updateErr || !updatedSub) {
      return NextResponse.json({ error: updateErr?.message || 'Failed to reopen submission' }, { status: 500 });
    }

    // 2. Send notification to school
    await adminClient.from('notifications').insert({
      school_id: updatedSub.school_id,
      title: 'Submission Reopened by Directorate',
      message: `Your school's statistical return was reopened for editing by the Planning & Statistics Unit. Reason: ${reason || 'Please review and resubmit.'}`,
      type: 'reopened',
      is_read: false,
    });

    // 3. Log to audit trail
    await adminClient.from('audit_log').insert({
      user_id: user?.id || null,
      action: 'REOPEN_SUBMISSION',
      target_type: 'submission',
      target_id: submission_id,
      details: {
        school_id: updatedSub.school_id,
        school_name: updatedSub.schools?.name,
        reason: reason || 'Admin requested correction',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Submission successfully reopened for the headteacher to edit.',
      submission: updatedSub,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
