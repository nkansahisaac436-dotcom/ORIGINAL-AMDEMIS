import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { circuitSchema } from '@/lib/schemas/school';
import { verifyAdminRole } from '@/lib/auth-helpers';
import { createAdminClient } from '@/lib/supabase/admin';
import { memoryCircuits, memorySchools } from '@/lib/memory-store';

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

    // Get active round
    const { data: activeRound } = await supabase
      .from('rounds')
      .select('id')
      .eq('is_active', true)
      .maybeSingle();

    const { data: circuits } = await supabase
      .from('circuits')
      .select(`
        *,
        schools (
          id,
          name,
          status,
          school_login_id,
          is_active,
          submissions (
            id,
            round_id,
            status
          )
        )
      `)
      .order('name', { ascending: true });

    const circuitMap = new Map<string, any>();

    (circuits || []).forEach((c: any) => {
      circuitMap.set(c.id, {
        ...c,
        schools: c.schools || [],
      });
    });

    // Merge memory circuits
    for (const mem of memoryCircuits.values()) {
      if (!circuitMap.has(mem.id)) {
        circuitMap.set(mem.id, {
          ...mem,
          schools: [],
        });
      }
    }

    // Merge any memory schools into their respective circuits
    for (const memSchool of memorySchools.values()) {
      const circ = circuitMap.get(memSchool.circuit_id);
      if (circ && !circ.schools.some((s: any) => s.id === memSchool.id)) {
        circ.schools.push({
          id: memSchool.id,
          name: memSchool.name,
          status: memSchool.status,
          school_login_id: memSchool.school_login_id,
          is_active: memSchool.is_active,
          submissions: [],
        });
      }
    }

    const result = Array.from(circuitMap.values()).map((c: any) => {
      const activeSchools = c.schools?.filter((s: any) => s.is_active) || [];
      const submittedSchools = activeSchools.filter((s: any) =>
        s.submissions?.some(
          (sub: any) => sub.round_id === activeRound?.id && sub.status === 'submitted'
        )
      );

      return {
        ...c,
        _school_count: activeSchools.length,
        _total_school_count: c.schools?.length || 0,
        _submitted_schools_count: submittedSchools.length,
        schools_list: (c.schools || []).map((s: any) => ({
          id: s.id,
          name: s.name,
          status: s.status,
          school_login_id: s.school_login_id,
          is_active: s.is_active,
          has_submitted: s.submissions?.some(
            (sub: any) => sub.round_id === activeRound?.id && sub.status === 'submitted'
          ),
        })),
      };
    });

    result.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json(result);
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
    const result = circuitSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0]?.message }, { status: 400 });
    }

    const { name, code, is_active } = result.data;
    const cleanName = name.replace(/\s+/g, ' ').trim();

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

    // Case-insensitive uniqueness check (ignoring extra spaces) across DB and memory store
    const { data: allCircuits } = await supabase.from('circuits').select('id, name');
    const existingNames = [
      ...(allCircuits || []).map((c) => c.name),
      ...Array.from(memoryCircuits.values()).map((c) => c.name),
    ];

    const duplicate = existingNames.find(
      (n) => n.replace(/\s+/g, ' ').trim().toLowerCase() === cleanName.toLowerCase()
    );

    if (duplicate) {
      return NextResponse.json(
        { error: `A circuit named "${cleanName}" already exists in the district.` },
        { status: 400 }
      );
    }

    let createdRecord: any = null;

    const { data: circuit, error } = await supabase
      .from('circuits')
      .insert({
        name: cleanName,
        code: code?.trim() || null,
        is_active,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error || !circuit) {
      // Graceful fallback to memory store
      const memId = crypto.randomUUID();
      createdRecord = {
        id: memId,
        name: cleanName,
        code: code?.trim() || null,
        is_active,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      memoryCircuits.set(memId, createdRecord);
    } else {
      createdRecord = circuit;
    }

    // Try audit log
    try {
      await supabase.from('audit_log').insert({
        user_id: adminAuth.userId || null,
        action: 'CREATE_CIRCUIT',
        target_type: 'circuit',
        target_id: createdRecord.id,
        details: { name: createdRecord.name, code: createdRecord.code },
      });
    } catch {
      // Ignore audit log error in restricted environments
    }

    return NextResponse.json(createdRecord);
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

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) {
      const cleanName = name.replace(/\s+/g, ' ').trim();
      if (cleanName.length < 2 || cleanName.length > 60) {
        return NextResponse.json(
          { error: 'Circuit name must be between 2 and 60 characters.' },
          { status: 400 }
        );
      }

      // Check uniqueness against other circuits
      const { data: allCircuits } = await supabase
        .from('circuits')
        .select('id, name')
        .neq('id', id);

      const otherMemNames = Array.from(memoryCircuits.entries())
        .filter(([k]) => k !== id)
        .map(([, v]) => v.name);

      const allOther = [...(allCircuits || []).map((c) => c.name), ...otherMemNames];

      const duplicate = allOther.find(
        (n) => n.replace(/\s+/g, ' ').trim().toLowerCase() === cleanName.toLowerCase()
      );

      if (duplicate) {
        return NextResponse.json(
          { error: `Another circuit named "${cleanName}" already exists.` },
          { status: 400 }
        );
      }

      updatePayload.name = cleanName;
    }

    if (code !== undefined) {
      updatePayload.code = code.trim() || null;
    }

    if (is_active !== undefined) {
      updatePayload.is_active = is_active;
    }

    let updatedRecord: any = null;

    const { data: updated, error } = await supabase
      .from('circuits')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error || !updated) {
      // Fallback to memory update
      const existingMem = memoryCircuits.get(id);
      if (existingMem) {
        updatedRecord = { ...existingMem, ...updatePayload };
        memoryCircuits.set(id, updatedRecord);
      } else {
        return NextResponse.json({ error: error?.message || 'Circuit not found' }, { status: 404 });
      }
    } else {
      updatedRecord = updated;
    }

    return NextResponse.json(updatedRecord);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const adminAuth = await verifyAdminRole();
    if (!adminAuth.isAdmin) {
      return NextResponse.json({ error: adminAuth.error || 'Admin access required' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Circuit ID is required' }, { status: 400 });
    }

    let adminClient;
    try {
      adminClient = createAdminClient();
    } catch {
      // Fallback
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

    const client = adminClient || supabase;

    // Check if circuit has any schools (active or inactive) in DB or memory
    const { count: schoolCount } = await client
      .from('schools')
      .select('*', { count: 'exact', head: true })
      .eq('circuit_id', id);

    const memSchoolCount = Array.from(memorySchools.values()).filter(
      (s) => s.circuit_id === id
    ).length;

    const totalAttached = (schoolCount || 0) + memSchoolCount;

    if (totalAttached > 0) {
      return NextResponse.json(
        {
          error: `Circuits with registered schools cannot be deleted to protect historical school data (${totalAttached} schools attached). Please Deactivate the circuit instead.`,
        },
        { status: 400 }
      );
    }

    const { error } = await client.from('circuits').delete().eq('id', id);
    if (error && !memoryCircuits.has(id)) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (memoryCircuits.has(id)) {
      memoryCircuits.delete(id);
    }

    try {
      await supabase.from('audit_log').insert({
        user_id: adminAuth.userId || null,
        action: 'DELETE_CIRCUIT',
        target_type: 'circuit',
        target_id: id,
        details: { deleted_id: id },
      });
    } catch {
      // Ignore in restricted environments
    }

    return NextResponse.json({ success: true, message: 'Circuit removed.' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
