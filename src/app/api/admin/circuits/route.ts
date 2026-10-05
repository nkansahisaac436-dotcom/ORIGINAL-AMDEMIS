import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { circuitSchema } from '@/lib/schemas/school';

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

    const { data: circuits, error } = await supabase
      .from('circuits')
      .select('*, schools(id, name, is_active)')
      .order('name', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const result = circuits.map((c) => ({
      ...c,
      _school_count: c.schools?.filter((s: any) => s.is_active)?.length || 0,
      _total_school_count: c.schools?.length || 0,
    }));

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = circuitSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0]?.message }, { status: 400 });
    }

    const { name, code, is_active } = result.data;
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

    const { data: circuit, error } = await supabase
      .from('circuits')
      .insert({
        name: name.trim(),
        code: code?.trim() || null,
        is_active,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Audit log
    await supabase.from('audit_log').insert({
      action: 'CREATE_CIRCUIT',
      target_type: 'circuit',
      target_id: circuit.id,
      details: { name: circuit.name, code: circuit.code },
    });

    return NextResponse.json(circuit);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, code, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: 'Circuit ID is required' }, { status: 400 });
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

    const { data: updated, error } = await supabase
      .from('circuits')
      .update({
        ...(name !== undefined && { name: name.trim() }),
        ...(code !== undefined && { code: code.trim() }),
        ...(is_active !== undefined && { is_active }),
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
      action: 'UPDATE_CIRCUIT',
      target_type: 'circuit',
      target_id: id,
      details: { name, is_active },
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
