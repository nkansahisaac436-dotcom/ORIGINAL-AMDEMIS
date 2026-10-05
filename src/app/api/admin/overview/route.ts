import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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

    // 1. Fetch Circuits & Schools
    const { data: circuits } = await supabase.from('circuits').select('id, name, is_active');
    const { data: schools } = await supabase
      .from('schools')
      .select('*, circuits(id, name)')
      .eq('is_active', true);

    // 2. Fetch Active Round
    const { data: activeRound } = await supabase
      .from('rounds')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // 3. Fetch Submissions for active round
    let submissions: any[] = [];
    if (activeRound) {
      const { data: subs } = await supabase
        .from('submissions')
        .select(`
          *,
          schools(id, name, status, headteacher_name, headteacher_phone, circuit_id, circuits(name)),
          submission_levels(level),
          enrolment(*),
          teachers(*),
          classrooms(*),
          furniture(*),
          infrastructure(*)
        `)
        .eq('round_id', activeRound.id);

      submissions = subs || [];
    }

    const totalSchoolsCount = schools?.length || 0;
    const submittedList = submissions.filter((s) => s.status === 'submitted');
    const draftList = submissions.filter((s) => s.status === 'draft' || s.status === 'reopened');

    const submittedSchoolIds = new Set(submittedList.map((s) => s.school_id));
    const draftSchoolIds = new Set(draftList.map((s) => s.school_id));

    // Non-submitters
    const nonSubmitters = (schools || [])
      .filter((s) => !submittedSchoolIds.has(s.id))
      .map((s) => ({
        school_id: s.id,
        school_name: s.name,
        circuit_name: s.circuits?.name || 'Circuit',
        status: s.status,
        headteacher_name: s.headteacher_name || 'N/A',
        headteacher_phone: s.headteacher_phone || 'N/A',
        submission_status: draftSchoolIds.has(s.id) ? 'draft' : 'not_started',
      }));

    const submittedCount = submittedList.length;
    const draftCount = draftList.length;
    const notStartedCount = Math.max(0, totalSchoolsCount - submittedCount - draftCount);
    const completionRate =
      totalSchoolsCount > 0 ? Math.round((submittedCount / totalSchoolsCount) * 100) : 0;

    // First-run checklist status
    const setupChecklist = {
      circuits_created: (circuits?.length || 0) > 0,
      circuits_count: circuits?.length || 0,
      schools_created: totalSchoolsCount > 0,
      schools_count: totalSchoolsCount,
      pins_generated: totalSchoolsCount > 0,
      round_opened: !!activeRound && activeRound.is_active,
      is_first_run_complete:
        (circuits?.length || 0) > 0 &&
        totalSchoolsCount > 0 &&
        !!activeRound &&
        activeRound.is_active,
    };

    // 4. Aggregated Analytics Charts Data
    // A. Enrolment by Level and Gender
    const enrolmentByLevel: Record<string, { boys: number; girls: number; total: number }> = {
      creche: { boys: 0, girls: 0, total: 0 },
      kg: { boys: 0, girls: 0, total: 0 },
      primary: { boys: 0, girls: 0, total: 0 },
      jhs: { boys: 0, girls: 0, total: 0 },
    };

    // B. Enrolment by Circuit
    const enrolmentByCircuitMap = new Map<string, { circuit_name: string; boys: number; girls: number; total: number }>();
    circuits?.forEach((c) => {
      enrolmentByCircuitMap.set(c.id, { circuit_name: c.name, boys: 0, girls: 0, total: 0 });
    });

    // C. Teachers Trained vs Untrained
    let totalTrained = 0;
    let totalUntrained = 0;

    // D. Classroom Condition
    let permanentClassrooms = 0;
    let goodClassrooms = 0;
    let dilapidatedClassrooms = 0;
    let underTreeClassrooms = 0;

    // E. Furniture Totals
    let totalMonoDesks = 0;
    let totalDualDesks = 0;
    let totalOthersFurniture = 0;

    // F. Infrastructure Availability
    const infraCounts = {
      electricity: 0,
      potable_water: 0,
      toilet_facility: 0,
      urinal_facility: 0,
      ict_lab: 0,
      library: 0,
      staff_common_room: 0,
      total_recorded: 0,
    };

    for (const sub of submittedList) {
      const circuitId = sub.schools?.circuit_id;

      // Aggregate enrolment
      sub.enrolment?.forEach((e: any) => {
        if (e.age_band === 'all') {
          if (enrolmentByLevel[e.level]) {
            if (e.gender === 'male') enrolmentByLevel[e.level].boys += e.count;
            if (e.gender === 'female') enrolmentByLevel[e.level].girls += e.count;
            enrolmentByLevel[e.level].total += e.count;
          }

          if (circuitId && enrolmentByCircuitMap.has(circuitId)) {
            const cData = enrolmentByCircuitMap.get(circuitId)!;
            if (e.gender === 'male') cData.boys += e.count;
            if (e.gender === 'female') cData.girls += e.count;
            cData.total += e.count;
          }
        }
      });

      // Aggregate teachers
      sub.teachers?.forEach((t: any) => {
        if (t.is_trained) totalTrained += t.count;
        else totalUntrained += t.count;
      });

      // Aggregate classrooms
      sub.classrooms?.forEach((cl: any) => {
        permanentClassrooms += cl.permanent || 0;
        goodClassrooms += cl.good_condition || 0;
        dilapidatedClassrooms += cl.dilapidated || 0;
        underTreeClassrooms += cl.under_tree || 0;
      });

      // Aggregate furniture
      sub.furniture?.forEach((f: any) => {
        if (f.furniture_type === 'mono_desk') totalMonoDesks += f.count || 0;
        if (f.furniture_type === 'dual_desk') totalDualDesks += f.count || 0;
        if (f.furniture_type === 'others') totalOthersFurniture += f.count || 0;
      });

      // Aggregate infrastructure
      if (sub.infrastructure && sub.infrastructure.length > 0) {
        const inf = sub.infrastructure[0];
        infraCounts.total_recorded += 1;
        if (inf.electricity) infraCounts.electricity += 1;
        if (inf.potable_water) infraCounts.potable_water += 1;
        if (inf.toilet_facility) infraCounts.toilet_facility += 1;
        if (inf.urinal_facility) infraCounts.urinal_facility += 1;
        if (inf.ict_lab === '1') infraCounts.ict_lab += 1;
        if (inf.library === '1') infraCounts.library += 1;
        if (inf.staff_common_room) infraCounts.staff_common_room += 1;
      }
    }

    const chartEnrolmentByLevel = [
      { level: 'Crèche/Nursery', boys: enrolmentByLevel.creche.boys, girls: enrolmentByLevel.creche.girls, total: enrolmentByLevel.creche.total },
      { level: 'KG', boys: enrolmentByLevel.kg.boys, girls: enrolmentByLevel.kg.girls, total: enrolmentByLevel.kg.total },
      { level: 'Primary', boys: enrolmentByLevel.primary.boys, girls: enrolmentByLevel.primary.girls, total: enrolmentByLevel.primary.total },
      { level: 'JHS', boys: enrolmentByLevel.jhs.boys, girls: enrolmentByLevel.jhs.girls, total: enrolmentByLevel.jhs.total },
    ];

    const chartEnrolmentByCircuit = Array.from(enrolmentByCircuitMap.values()).map((c) => ({
      name: c.circuit_name,
      boys: c.boys,
      girls: c.girls,
      total: c.total,
    }));

    const chartTeachersTraining = [
      { name: 'Trained Teachers', value: totalTrained, fill: '#123B86' },
      { name: 'Untrained Teachers', value: totalUntrained, fill: '#F2B705' },
    ];

    const chartClassroomCondition = [
      { condition: 'Good Condition', count: goodClassrooms, fill: '#10B981' },
      { condition: 'Dilapidated', count: dilapidatedClassrooms, fill: '#EF4444' },
      { condition: 'Under Tree', count: underTreeClassrooms, fill: '#F59E0B' },
    ];

    const chartFurniture = [
      { type: 'Mono Desk', count: totalMonoDesks },
      { type: 'Dual Desk', count: totalDualDesks },
      { type: 'Others (Chairs, Tables)', count: totalOthersFurniture },
    ];

    const infraPercentage = (val: number) =>
      infraCounts.total_recorded > 0 ? Math.round((val / infraCounts.total_recorded) * 100) : 0;

    const chartInfrastructure = [
      { facility: 'Functional Electricity', percent: infraPercentage(infraCounts.electricity) },
      { facility: 'Potable Water', percent: infraPercentage(infraCounts.potable_water) },
      { facility: 'Owned Toilet Facility', percent: infraPercentage(infraCounts.toilet_facility) },
      { facility: 'Owned Urinal Facility', percent: infraPercentage(infraCounts.urinal_facility) },
      { facility: 'ICT Laboratory', percent: infraPercentage(infraCounts.ict_lab) },
      { facility: 'Library Facility', percent: infraPercentage(infraCounts.library) },
      { facility: 'Staff Common Room', percent: infraPercentage(infraCounts.staff_common_room) },
    ];

    return NextResponse.json({
      activeRound,
      metrics: {
        totalSchools: totalSchoolsCount,
        submitted: submittedCount,
        draft: draftCount,
        notStarted: notStartedCount,
        completionRate,
      },
      setupChecklist,
      nonSubmitters,
      charts: {
        enrolmentByLevel: chartEnrolmentByLevel,
        enrolmentByCircuit: chartEnrolmentByCircuit,
        teachersTraining: chartTeachersTraining,
        classroomCondition: chartClassroomCondition,
        furniture: chartFurniture,
        infrastructure: chartInfrastructure,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
