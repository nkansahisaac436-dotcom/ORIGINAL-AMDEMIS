import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { roundSchema } from '@/lib/schemas/school';

export async function GET() {
  try {
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

    const { data: rounds, error } = await supabase
      .from('rounds')
      .select('*, submissions(id, status)')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const formatted = rounds.map((r) => {
      const subs = r.submissions || [];
      const submittedCount = subs.filter((s: any) => s.status === 'submitted').length;
      const draftCount = subs.filter((s: any) => s.status === 'draft' || s.status === 'reopened').length;

      return {
        ...r,
        submitted_count: submittedCount,
        draft_count: draftCount,
        total_submissions: subs.length,
      };
    });

    return NextResponse.json(formatted);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = roundSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0]?.message }, { status: 400 });
    }

    const { title, instructions, opening_date, deadline, is_active, is_locked } = result.data;
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

    // If making this round active, deactivate previous active rounds
    if (is_active) {
      await supabase.from('rounds').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000');
    }

    const { data: newRound, error } = await supabase
      .from('rounds')
      .insert({
        title: title.trim(),
        instructions: instructions?.trim() || null,
        opening_date,
        deadline,
        is_active,
        is_locked,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Audit log
    await supabase.from('audit_log').insert({
      action: 'CREATE_COLLECTION_ROUND',
      target_type: 'round',
      target_id: newRound.id,
      details: { title: newRound.title, deadline: newRound.deadline },
    });

    return NextResponse.json(newRound);
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
      return NextResponse.json({ error: 'Round ID is required' }, { status: 400 });
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

    if (updates.is_active) {
      await supabase.from('rounds').update({ is_active: false }).neq('id', id);
    }

    const { data: updated, error } = await supabase
      .from('rounds')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Audit log
    await supabase.from('audit_log').insert({
      action: 'UPDATE_COLLECTION_ROUND',
      target_type: 'round',
      target_id: id,
      details: updates,
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
