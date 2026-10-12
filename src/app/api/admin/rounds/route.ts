import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { roundSchema } from '@/lib/schemas/school';
import { verifyAdminRole } from '@/lib/auth-helpers';
import { createAdminClient } from '@/lib/supabase/admin';
import { memoryRounds } from '@/lib/memory-store';

export async function GET() {
  try {
    const adminAuth = await verifyAdminRole();
    if (!adminAuth.isAdmin) {
      return NextResponse.json({ error: adminAuth.error || 'Admin access required' }, { status: 403 });
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

    let adminClient;
    try {
      adminClient = createAdminClient();
    } catch {
      // Fallback
    }
    const client = adminClient || supabase;

    const { data: dbRounds } = await client
      .from('rounds')
      .select('*, submissions(id, status)')
      .order('created_at', { ascending: false });

    const roundsMap = new Map<string, any>();
    (dbRounds || []).forEach((r: any) => roundsMap.set(r.id, r));

    for (const memRound of memoryRounds.values()) {
      if (!roundsMap.has(memRound.id)) {
        roundsMap.set(memRound.id, {
          ...memRound,
          submissions: [],
        });
      }
    }

    const formatted = Array.from(roundsMap.values()).map((r: any) => {
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

    formatted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json(formatted);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminAuth = await verifyAdminRole();
    if (!adminAuth.isAdmin) {
      return NextResponse.json({ error: adminAuth.error || 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const result = roundSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0]?.message }, { status: 400 });
    }

    const { title, instructions, opening_date, deadline, is_active, is_locked } = result.data;
    
    let adminClient: any = null;
    try {
      adminClient = createAdminClient();
    } catch {
      // Fallback
    }

    // Only one round can be active at a time
    if (is_active) {
      if (adminClient) {
        try {
          await adminClient.from('rounds').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000');
        } catch {
          // Ignore
        }
      }
      for (const r of memoryRounds.values()) {
        r.is_active = false;
      }
    }

    let finalRound: any = null;
    if (adminClient) {
      try {
        const { data: newRound, error } = await adminClient
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

        if (newRound && !error) {
          finalRound = newRound;
        }
      } catch {
        // Fallback
      }
    }

    if (!finalRound) {
      const roundId = crypto.randomUUID();
      finalRound = {
        id: roundId,
        title: title.trim(),
        instructions: instructions?.trim() || null,
        opening_date,
        deadline,
        is_active,
        is_locked,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      memoryRounds.set(roundId, finalRound);
    }

    return NextResponse.json(finalRound);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const adminAuth = await verifyAdminRole();
    if (!adminAuth.isAdmin) {
      return NextResponse.json({ error: adminAuth.error || 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { id, action, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Round ID is required' }, { status: 400 });
    }

    let adminClient: any = null;
    try {
      adminClient = createAdminClient();
    } catch {
      // Fallback
    }

    // Handle special action: "close"
    if (action === 'close') {
      let closedRound: any = null;
      if (adminClient) {
        try {
          const { data: updated } = await adminClient
            .from('rounds')
            .update({
              is_active: false,
              is_locked: true,
              updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .maybeSingle();
          if (updated) closedRound = updated;
        } catch {
          // Fallback
        }
      }

      if (!closedRound && memoryRounds.has(id)) {
        const mem = memoryRounds.get(id)!;
        closedRound = { ...mem, is_active: false, is_locked: true, updated_at: new Date().toISOString() };
        memoryRounds.set(id, closedRound);
      }

      return NextResponse.json({ success: true, round: closedRound || { id, is_active: false, is_locked: true } });
    }

    // Handle special action: "extend_deadline"
    if (action === 'extend_deadline' && updates.deadline) {
      let extendedRound: any = null;
      if (adminClient) {
        try {
          const { data: updated } = await adminClient
            .from('rounds')
            .update({
              deadline: updates.deadline,
              updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .maybeSingle();
          if (extendedRound) extendedRound = updated;
        } catch {
          // Fallback
        }
      }

      if (!extendedRound && memoryRounds.has(id)) {
        const mem = memoryRounds.get(id)!;
        extendedRound = { ...mem, deadline: updates.deadline, updated_at: new Date().toISOString() };
        memoryRounds.set(id, extendedRound);
      }

      return NextResponse.json({ success: true, round: extendedRound || { id, deadline: updates.deadline } });
    }

    // Only one round can be active at a time
    if (updates.is_active === true) {
      if (adminClient) {
        try {
          await adminClient.from('rounds').update({ is_active: false }).neq('id', id);
        } catch {
          // Ignore
        }
      }
      for (const [k, r] of memoryRounds.entries()) {
        if (k !== id) r.is_active = false;
      }
    }

    let updatedRecord: any = null;
    if (adminClient) {
      try {
        const { data: updated } = await adminClient
          .from('rounds')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .maybeSingle();
        if (updated) updatedRecord = updated;
      } catch {
        // Fallback
      }
    }

    if (!updatedRecord && memoryRounds.has(id)) {
      const mem = memoryRounds.get(id)!;
      updatedRecord = { ...mem, ...updates, updated_at: new Date().toISOString() };
      memoryRounds.set(id, updatedRecord);
    }

    return NextResponse.json(updatedRecord || { id, ...updates });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
