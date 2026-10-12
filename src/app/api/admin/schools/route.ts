import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { schoolSchema } from '@/lib/schemas/school';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyAdminRole, generateSecurePin, findSimilarSchoolName } from '@/lib/auth-helpers';
import { memoryCircuits, memorySchools, memoryCredentials } from '@/lib/memory-store';

export async function GET(request: NextRequest) {
  try {
    const adminAuth = await verifyAdminRole();
    if (!adminAuth.isAdmin) {
      return NextResponse.json({ error: adminAuth.error || 'Admin access required' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search')?.toLowerCase() || '';
    const circuitId = searchParams.get('circuit_id') || '';
    const status = searchParams.get('status') || '';
    const accountStatus = searchParams.get('account_status') || '';
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

    let adminClient;
    try {
      adminClient = createAdminClient();
    } catch {
      // Fallback
    }
    const client = adminClient || supabase;

    // Get active round
    const { data: activeRound } = await client
      .from('rounds')
      .select('id')
      .eq('is_active', true)
      .maybeSingle();

    let query = client
      .from('schools')
      .select(`
        *,
        circuits(id, name),
        submissions(id, round_id, status, submitted_at)
      `)
      .order('name', { ascending: true });

    if (circuitId && circuitId !== 'all') {
      query = query.eq('circuit_id', circuitId);
    }
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: dbSchools } = await query;

    // Fetch profiles for account status
    const { data: profiles } = await client
      .from('profiles')
      .select('school_id, is_initial_pin, failed_attempts, locked_until, updated_at');

    const profileMap = new Map<string, any>();
    profiles?.forEach((p) => {
      if (p.school_id) profileMap.set(p.school_id, p);
    });

    // Fetch audit log for last PIN resets
    const { data: resetLogs } = await client
      .from('audit_log')
      .select('target_id, created_at, user_id, details')
      .eq('action', 'RESET_SCHOOL_PIN')
      .order('created_at', { ascending: false });

    const lastResetMap = new Map<string, { at: string; by: string | null }>();
    resetLogs?.forEach((log) => {
      if (log.target_id && !lastResetMap.has(log.target_id)) {
        lastResetMap.set(log.target_id, {
          at: log.created_at,
          by: log.user_id,
        });
      }
    });

    const combinedSchools: any[] = [...(dbSchools || [])];
    const dbSchoolIds = new Set(combinedSchools.map((s) => s.id));

    // Merge memory schools
    for (const memSchool of memorySchools.values()) {
      if (!dbSchoolIds.has(memSchool.id)) {
        const circ = memoryCircuits.get(memSchool.circuit_id);
        combinedSchools.push({
          ...memSchool,
          circuits: circ ? { id: circ.id, name: circ.name } : memSchool.circuits || { id: memSchool.circuit_id, name: 'Circuit' },
          submissions: [],
        });
      }
    }

    let result = combinedSchools.map((s: any) => {
      const activeSub = activeRound
        ? s.submissions?.find((sub: any) => sub.round_id === activeRound.id)
        : null;

      const profile = profileMap.get(s.id);
      const memCred = memoryCredentials.get(s.school_login_id?.toUpperCase());

      const lockedUntil = profile?.locked_until || memCred?.locked_until;
      const isLocked = lockedUntil && new Date(lockedUntil) > new Date();
      const hasSubmissions = (s.submissions || []).length > 0;
      const isInitialPin = profile?.is_initial_pin ?? memCred?.is_initial_pin ?? true;
      const failedAttempts = profile?.failed_attempts ?? memCred?.failed_attempts ?? 0;

      let accStatus: 'locked' | 'never_logged_in' | 'active' = 'active';
      if (isLocked) {
        accStatus = 'locked';
      } else if (isInitialPin && !hasSubmissions) {
        accStatus = 'never_logged_in';
      }

      const resetInfo = lastResetMap.get(s.id);

      return {
        ...s,
        circuit_name: s.circuits?.name || 'Unassigned',
        submission_status: activeSub?.status || 'not_started',
        submitted_at: activeSub?.submitted_at || null,
        account_status: accStatus,
        locked_until: lockedUntil || null,
        failed_attempts: failedAttempts,
        is_initial_pin: isInitialPin,
        last_pin_reset_at: resetInfo?.at || null,
        last_pin_reset_by: resetInfo?.by || null,
        total_submissions_count: s.submissions?.length || 0,
      };
    });

    if (search) {
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(search) ||
          s.school_login_id.toLowerCase().includes(search) ||
          (s.emis_code && s.emis_code.toLowerCase().includes(search)) ||
          (s.town && s.town.toLowerCase().includes(search)) ||
          (s.circuit_name && s.circuit_name.toLowerCase().includes(search))
      );
    }

    if (level && level !== 'all') {
      result = result.filter((s) => s.default_levels?.includes(level));
    }

    if (accountStatus && accountStatus !== 'all') {
      result = result.filter((s) => s.account_status === accountStatus);
    }

    if (circuitId && circuitId !== 'all') {
      result = result.filter((s) => s.circuit_id === circuitId);
    }

    if (status && status !== 'all') {
      result = result.filter((s) => s.status === status);
    }

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
    const result = schoolSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0]?.message }, { status: 400 });
    }

    const schoolData = result.data;
    const confirmSimilar = Boolean(body.confirm_similar);

    let adminClient: any = null;
    try {
      adminClient = createAdminClient();
    } catch {
      // Fallback
    }

    // 1. Verify Circuit exists and is active (DB or memory)
    let circuit: any = null;
    if (adminClient) {
      const { data: dbCirc } = await adminClient
        .from('circuits')
        .select('id, name, is_active')
        .eq('id', schoolData.circuit_id)
        .maybeSingle();
      if (dbCirc) circuit = dbCirc;
    }

    if (!circuit) {
      const memCirc = memoryCircuits.get(schoolData.circuit_id);
      if (memCirc) circuit = memCirc;
    }

    if (!circuit) {
      return NextResponse.json({ error: 'Selected circuit does not exist.' }, { status: 400 });
    }

    // 2. Uniqueness check within the same circuit (DB + memory)
    let circuitSchoolNames: string[] = [];
    if (adminClient) {
      const { data: circuitSchools } = await adminClient
        .from('schools')
        .select('id, name')
        .eq('circuit_id', schoolData.circuit_id);
      if (circuitSchools) {
        circuitSchoolNames.push(...circuitSchools.map((s: any) => s.name));
      }
    }

    for (const s of memorySchools.values()) {
      if (s.circuit_id === schoolData.circuit_id) {
        circuitSchoolNames.push(s.name);
      }
    }

    const cleanName = schoolData.name.replace(/\s+/g, ' ').trim();
    const exactDuplicate = circuitSchoolNames.find(
      (n) => n.replace(/\s+/g, ' ').trim().toLowerCase() === cleanName.toLowerCase()
    );

    if (exactDuplicate) {
      return NextResponse.json(
        { error: `A school named "${cleanName}" already exists in ${circuit.name}.` },
        { status: 400 }
      );
    }

    // Check fuzzy similarity if not confirmed
    if (!confirmSimilar && circuitSchoolNames.length > 0) {
      const similarName = findSimilarSchoolName(cleanName, circuitSchoolNames);

      if (similarName) {
        return NextResponse.json(
          {
            warning: 'similar_name',
            message: `A very similar school name "${similarName}" already exists in ${circuit.name}. Please confirm if this is a distinct school.`,
            existing_name: similarName,
          },
          { status: 409 }
        );
      }
    }

    // 3. Atomic next School Login ID: scan existing AMD-XXXX IDs (DB + memory)
    let allLoginIds: string[] = [];
    if (adminClient) {
      const { data: ids } = await adminClient.from('schools').select('school_login_id');
      if (ids) {
        allLoginIds.push(...ids.map((r: any) => r.school_login_id));
      }
    }
    for (const s of memorySchools.values()) {
      allLoginIds.push(s.school_login_id);
    }

    let maxNum = 0;
    allLoginIds.forEach((idStr) => {
      const match = (idStr || '').match(/AMD-(\d+)/i);
      if (match) {
        const val = parseInt(match[1], 10);
        if (val > maxNum) maxNum = val;
      }
    });

    const nextIdNumber = maxNum + 1;
    const loginId = `AMD-${String(nextIdNumber).padStart(4, '0')}`;
    const generatedPin = generateSecurePin();
    const syntheticEmail = `${loginId.toLowerCase()}@amdemis.local`;

    let finalSchool: any = null;

    // 4. Try creating DB school record if adminClient exists
    if (adminClient) {
      try {
        const { data: newSchool, error: schoolError } = await adminClient
          .from('schools')
          .insert({
            name: cleanName,
            status: schoolData.status,
            circuit_id: schoolData.circuit_id,
            school_login_id: loginId,
            emis_code: schoolData.emis_code?.trim() || null,
            town: schoolData.town?.trim() || null,
            default_levels: schoolData.default_levels,
            headteacher_name: schoolData.headteacher_name?.trim() || null,
            headteacher_phone: schoolData.headteacher_phone?.trim() || null,
            assistant_headteacher_name: schoolData.assistant_headteacher_name?.trim() || null,
            assistant_headteacher_phone: schoolData.assistant_headteacher_phone?.trim() || null,
            is_active: schoolData.is_active,
            updated_at: new Date().toISOString(),
          })
          .select('*, circuits(name)')
          .single();

        if (newSchool && !schoolError) {
          finalSchool = newSchool;

          // Try Supabase Auth user
          try {
            const { data: createdUser, error: authError } = await adminClient.auth.admin.createUser({
              email: syntheticEmail,
              password: generatedPin,
              email_confirm: true,
              user_metadata: {
                role: 'headteacher',
                school_id: newSchool.id,
                school_name: newSchool.name,
              },
            });

            if (createdUser?.user && !authError) {
              await adminClient.from('profiles').upsert({
                id: createdUser.user.id,
                role: 'headteacher',
                school_id: newSchool.id,
                full_name: schoolData.headteacher_name || 'Headteacher',
                phone: schoolData.headteacher_phone || null,
                is_initial_pin: true,
                failed_attempts: 0,
                locked_until: null,
                updated_at: new Date().toISOString(),
              });
            }
          } catch {
            // Auth admin error; fallback credential stored below
          }
        }
      } catch {
        // DB insert failed; fallback to memory store
      }
    }

    if (!finalSchool) {
      // Memory Store Fallback
      const schoolId = crypto.randomUUID();
      finalSchool = {
        id: schoolId,
        name: cleanName,
        status: schoolData.status,
        circuit_id: schoolData.circuit_id,
        circuits: { id: circuit.id, name: circuit.name },
        school_login_id: loginId,
        emis_code: schoolData.emis_code?.trim() || null,
        town: schoolData.town?.trim() || null,
        default_levels: schoolData.default_levels,
        headteacher_name: schoolData.headteacher_name?.trim() || null,
        headteacher_phone: schoolData.headteacher_phone?.trim() || null,
        assistant_headteacher_name: schoolData.assistant_headteacher_name?.trim() || null,
        assistant_headteacher_phone: schoolData.assistant_headteacher_phone?.trim() || null,
        is_active: schoolData.is_active,
        is_locked: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      memorySchools.set(schoolId, finalSchool);
    }

    // Always ensure memory credentials has a copy so login works regardless of DB auth setup
    memoryCredentials.set(loginId.toUpperCase(), {
      school_login_id: loginId.toUpperCase(),
      pin_hash: generatedPin,
      is_initial_pin: true,
      failed_attempts: 0,
      locked_until: null,
    });

    // Audit log (NEVER logging the plain PIN)
    try {
      if (adminClient) {
        await adminClient.from('audit_log').insert({
          user_id: adminAuth.userId || null,
          action: 'CREATE_SCHOOL',
          target_type: 'school',
          target_id: finalSchool.id,
          details: {
            name: finalSchool.name,
            school_login_id: loginId,
            circuit_id: finalSchool.circuit_id,
            circuit_name: circuit.name,
          },
        });
      }
    } catch {
      // Ignore
    }

    return NextResponse.json({
      school: finalSchool,
      credentials: {
        school_login_id: loginId,
        pin: generatedPin,
        school_name: finalSchool.name,
        circuit_name: circuit.name,
      },
    });
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
      return NextResponse.json({ error: 'School ID is required' }, { status: 400 });
    }

    let adminClient: any = null;
    try {
      adminClient = createAdminClient();
    } catch {
      // Fallback
    }

    // Check school exists (DB or memory)
    let currentSchool: any = null;
    if (adminClient) {
      const { data: dbSchool } = await adminClient
        .from('schools')
        .select('*, circuits(name)')
        .eq('id', id)
        .maybeSingle();
      if (dbSchool) currentSchool = dbSchool;
    }

    if (!currentSchool) {
      const memSchool = memorySchools.get(id);
      if (memSchool) currentSchool = memSchool;
    }

    if (!currentSchool) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    // Action: Lock / Unlock account
    if (action === 'lock' || action === 'unlock') {
      const shouldLock = action === 'lock';
      const lockedUntil = shouldLock
        ? new Date(Date.now() + 15 * 60 * 1000).toISOString()
        : null;

      if (adminClient) {
        try {
          await adminClient
            .from('profiles')
            .update({
              locked_until: lockedUntil,
              failed_attempts: shouldLock ? 5 : 0,
              updated_at: new Date().toISOString(),
            })
            .eq('school_id', id);
        } catch {
          // Fallback to memory
        }
      }

      const memCred = memoryCredentials.get(currentSchool.school_login_id?.toUpperCase());
      if (memCred) {
        memCred.locked_until = lockedUntil;
        memCred.failed_attempts = shouldLock ? 5 : 0;
      }

      return NextResponse.json({
        success: true,
        message: shouldLock ? 'School account locked for 15 minutes.' : 'School account unlocked.',
        locked_until: lockedUntil,
      });
    }

    // Action: Move to another circuit
    if (updates.circuit_id && updates.circuit_id !== currentSchool.circuit_id) {
      let newCircuitName = 'Circuit';
      if (adminClient) {
        const { data: newCirc } = await adminClient
          .from('circuits')
          .select('name')
          .eq('id', updates.circuit_id)
          .maybeSingle();
        if (newCirc) newCircuitName = newCirc.name;
      }
      if (newCircuitName === 'Circuit') {
        const memC = memoryCircuits.get(updates.circuit_id);
        if (memC) newCircuitName = memC.name;
      }

      let updatedSchool: any = null;
      if (adminClient) {
        const { data: updated } = await adminClient
          .from('schools')
          .update({
            circuit_id: updates.circuit_id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select('*, circuits(name)')
          .maybeSingle();
        if (updated) updatedSchool = updated;
      }

      if (!updatedSchool && memorySchools.has(id)) {
        const mem = memorySchools.get(id)!;
        updatedSchool = {
          ...mem,
          circuit_id: updates.circuit_id,
          circuits: { id: updates.circuit_id, name: newCircuitName },
          updated_at: new Date().toISOString(),
        };
        memorySchools.set(id, updatedSchool);
      }

      return NextResponse.json(updatedSchool || currentSchool);
    }

    // Action: Deactivate / Reactivate
    if (updates.is_active !== undefined) {
      let updatedSchool: any = null;
      if (adminClient) {
        const { data: updated } = await adminClient
          .from('schools')
          .update({
            is_active: updates.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select('*, circuits(name)')
          .maybeSingle();
        if (updated) updatedSchool = updated;
      }

      if (!updatedSchool && memorySchools.has(id)) {
        const mem = memorySchools.get(id)!;
        updatedSchool = {
          ...mem,
          is_active: updates.is_active,
          updated_at: new Date().toISOString(),
        };
        memorySchools.set(id, updatedSchool);
      }

      return NextResponse.json(updatedSchool || currentSchool);
    }

    // Standard school details edit
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.name !== undefined) {
      updatePayload.name = updates.name.replace(/\s+/g, ' ').trim();
    }
    if (updates.status !== undefined) updatePayload.status = updates.status;
    if (updates.emis_code !== undefined) updatePayload.emis_code = updates.emis_code?.trim() || null;
    if (updates.town !== undefined) updatePayload.town = updates.town?.trim() || null;
    if (updates.headteacher_name !== undefined) {
      updatePayload.headteacher_name = updates.headteacher_name?.trim() || null;
    }
    if (updates.headteacher_phone !== undefined) {
      updatePayload.headteacher_phone = updates.headteacher_phone?.trim() || null;
    }
    if (updates.default_levels !== undefined) {
      updatePayload.default_levels = updates.default_levels;
    }

    let updatedRecord: any = null;
    if (adminClient) {
      const { data: updated } = await adminClient
        .from('schools')
        .update(updatePayload)
        .eq('id', id)
        .select('*, circuits(name)')
        .maybeSingle();
      if (updated) updatedRecord = updated;
    }

    if (!updatedRecord && memorySchools.has(id)) {
      const mem = memorySchools.get(id)!;
      updatedRecord = { ...mem, ...updatePayload };
      memorySchools.set(id, updatedRecord);
    }

    return NextResponse.json(updatedRecord || currentSchool);
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
      return NextResponse.json({ error: 'School ID is required' }, { status: 400 });
    }

    let adminClient: any = null;
    try {
      adminClient = createAdminClient();
    } catch {
      // Fallback
    }

    if (adminClient) {
      // Check if school has submissions
      const { count: subCount } = await adminClient
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .eq('school_id', id);

      if (subCount && subCount > 0) {
        return NextResponse.json(
          {
            error: `Schools with submitted or draft returns cannot be deleted to maintain official district records (${subCount} submissions found). You can Deactivate the school instead.`,
          },
          { status: 400 }
        );
      }

      await adminClient.from('schools').delete().eq('id', id);
    }

    if (memorySchools.has(id)) {
      const mem = memorySchools.get(id);
      if (mem) {
        memoryCredentials.delete(mem.school_login_id?.toUpperCase());
      }
      memorySchools.delete(id);
    }

    return NextResponse.json({ success: true, message: 'School removed.' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
