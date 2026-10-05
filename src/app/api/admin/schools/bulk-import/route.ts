import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generatePin } from '@/lib/utils';
import { LevelId } from '@/lib/levels-config';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { rows, auto_create_circuits } = (await request.json()) as {
      rows: Array<{
        school_name: string;
        status: 'public' | 'private';
        circuit: string;
        levels?: string;
        town?: string;
        emis_code?: string;
      }>;
      auto_create_circuits?: boolean;
    };

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'No data rows provided' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // 1. Fetch existing circuits
    const { data: existingCircuits } = await adminClient.from('circuits').select('id, name');
    const circuitMap = new Map<string, string>();
    existingCircuits?.forEach((c) => {
      circuitMap.set(c.name.trim().toLowerCase(), c.id);
    });

    // 2. Auto-create missing circuits if requested
    if (auto_create_circuits) {
      for (const row of rows) {
        const cName = row.circuit?.trim();
        if (cName && !circuitMap.has(cName.toLowerCase())) {
          const { data: newC } = await adminClient
            .from('circuits')
            .insert({ name: cName, is_active: true })
            .select('id, name')
            .single();

          if (newC) {
            circuitMap.set(newC.name.trim().toLowerCase(), newC.id);
          }
        }
      }
    }

    // 3. Process each row
    const importedSchools = [];
    const skippedRows = [];

    // Get current school count to calculate next sequence numbers
    const { count: currentCount } = await adminClient
      .from('schools')
      .select('*', { count: 'exact', head: true });

    let nextNumber = (currentCount || 0) + 1;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const circuitId = circuitMap.get(row.circuit?.trim().toLowerCase());

      if (!circuitId) {
        skippedRows.push({
          row: i + 1,
          school_name: row.school_name,
          reason: `Circuit "${row.circuit}" does not exist. Enable "Auto-create missing circuits" or create the circuit first.`,
        });
        continue;
      }

      if (!row.school_name || !row.status) {
        skippedRows.push({
          row: i + 1,
          school_name: row.school_name || 'Unnamed',
          reason: 'Missing required school name or status (public/private).',
        });
        continue;
      }

      // Parse default levels
      const levelsRaw = row.levels?.toLowerCase() || 'primary';
      const defaultLevels: LevelId[] = [];
      if (levelsRaw.includes('creche') || levelsRaw.includes('nursery')) defaultLevels.push('creche');
      if (levelsRaw.includes('kg') || levelsRaw.includes('kindergarten')) defaultLevels.push('kg');
      if (levelsRaw.includes('primary') || levelsRaw.includes('basic')) defaultLevels.push('primary');
      if (levelsRaw.includes('jhs') || levelsRaw.includes('junior')) defaultLevels.push('jhs');
      if (defaultLevels.length === 0) defaultLevels.push('primary');

      const loginId = `AMD-${String(nextNumber).padStart(4, '0')}`;
      nextNumber++;
      const pin = generatePin();
      const syntheticEmail = `${loginId.toLowerCase()}@amdemis.local`;

      // Insert school
      const { data: newSchool, error: schoolErr } = await adminClient
        .from('schools')
        .insert({
          name: row.school_name.trim(),
          status: row.status.toLowerCase() === 'private' ? 'private' : 'public',
          circuit_id: circuitId,
          school_login_id: loginId,
          emis_code: row.emis_code?.trim() || null,
          town: row.town?.trim() || null,
          default_levels: defaultLevels,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .select('*, circuits(name)')
        .single();

      if (schoolErr || !newSchool) {
        skippedRows.push({
          row: i + 1,
          school_name: row.school_name,
          reason: schoolErr?.message || 'Database error',
        });
        continue;
      }

      // Create auth user
      const { data: createdAuth } = await adminClient.auth.admin.createUser({
        email: syntheticEmail,
        password: pin,
        email_confirm: true,
        user_metadata: { role: 'headteacher', school_id: newSchool.id },
      });

      if (createdAuth?.user) {
        await adminClient.from('profiles').insert({
          id: createdAuth.user.id,
          role: 'headteacher',
          school_id: newSchool.id,
          full_name: 'Headteacher',
          is_initial_pin: true,
          failed_attempts: 0,
          updated_at: new Date().toISOString(),
        });
      }

      importedSchools.push({
        id: newSchool.id,
        name: newSchool.name,
        school_login_id: loginId,
        pin,
        circuit_name: newSchool.circuits?.name || row.circuit,
        status: newSchool.status,
      });
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
      action: 'BULK_IMPORT_SCHOOLS',
      target_type: 'schools',
      details: {
        imported_count: importedSchools.length,
        skipped_count: skippedRows.length,
      },
    });

    return NextResponse.json({
      success: true,
      imported: importedSchools,
      skipped: skippedRows,
      importedCount: importedSchools.length,
      skippedCount: skippedRows.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
