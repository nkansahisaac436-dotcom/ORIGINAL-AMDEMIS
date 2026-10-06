import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import ExcelJS from 'exceljs';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const roundId = searchParams.get('round_id');

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

    // Get Active Round or specific round
    let roundQuery = supabase.from('rounds').select('*');
    if (roundId) {
      roundQuery = roundQuery.eq('id', roundId);
    } else {
      roundQuery = roundQuery.eq('is_active', true).order('created_at', { ascending: false });
    }
    const { data: roundData } = await roundQuery.limit(1).maybeSingle();
    const targetRound = roundData;

    if (!targetRound) {
      return NextResponse.json({ error: 'No collection round found' }, { status: 404 });
    }

    // Fetch all schools and circuits
    const { data: circuits } = await supabase.from('circuits').select('*').order('name');
    const { data: schools } = await supabase
      .from('schools')
      .select('*, circuits(name)')
      .eq('is_active', true)
      .order('name');

    // Fetch submissions for this round
    const { data: submissions } = await supabase
      .from('submissions')
      .select(`
        *,
        schools(*, circuits(name)),
        submission_levels(level),
        enrolment(*),
        teachers(*),
        classrooms(*),
        furniture(*),
        staff_payroll(*),
        special_teachers(*),
        infrastructure(*)
      `)
      .eq('round_id', targetRound.id);

    const submissionMap = new Map<string, any>();
    submissions?.forEach((s) => {
      submissionMap.set(s.school_id, s);
    });

    // Create Excel Workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'AMDEMIS - Planning & Statistics Directorate';
    workbook.created = new Date();

    // ==========================================
    // 1. MASTER SHEET (One Row Per School)
    // ==========================================
    const masterSheet = workbook.addWorksheet('Master School Data', {
      views: [{ state: 'frozen', xSplit: 3, ySplit: 1 }],
    });

    masterSheet.columns = [
      { header: 'School Login ID', key: 'login_id', width: 14 },
      { header: 'School Name', key: 'school_name', width: 32 },
      { header: 'Circuit', key: 'circuit', width: 18 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'EMIS Code', key: 'emis_code', width: 15 },
      { header: 'Town / Location', key: 'town', width: 18 },
      { header: 'Established Year', key: 'year_est', width: 14 },
      { header: 'Submission Status', key: 'sub_status', width: 16 },
      { header: 'Submitted At', key: 'submitted_at', width: 20 },
      { header: 'Headteacher Name', key: 'ht_name', width: 24 },
      { header: 'Headteacher Phone', key: 'ht_phone', width: 18 },
      { header: 'Assistant Name', key: 'asst_name', width: 22 },
      { header: 'Assistant Phone', key: 'asst_phone', width: 18 },
      { header: 'Total School Teachers', key: 'tot_teachers', width: 18 },
      { header: 'Male Teachers', key: 'male_teachers', width: 14 },
      { header: 'Female Teachers', key: 'female_teachers', width: 14 },
      // Crèche
      { header: 'Crèche Boys', key: 'creche_b', width: 12 },
      { header: 'Crèche Girls', key: 'creche_g', width: 12 },
      { header: 'Crèche Total', key: 'creche_tot', width: 12 },
      // KG
      { header: 'KG1 Boys', key: 'kg1_b', width: 12 },
      { header: 'KG1 Girls', key: 'kg1_g', width: 12 },
      { header: 'KG1 Total', key: 'kg1_tot', width: 12 },
      { header: 'KG2 Boys', key: 'kg2_b', width: 12 },
      { header: 'KG2 Girls', key: 'kg2_g', width: 12 },
      { header: 'KG2 Total', key: 'kg2_tot', width: 12 },
      { header: 'KG Total Enrolment', key: 'kg_tot', width: 16 },
      { header: 'KG Trained Teachers', key: 'kg_trained', width: 16 },
      { header: 'KG Untrained Teachers', key: 'kg_untrained', width: 16 },
      // Primary
      { header: 'BS1 Boys', key: 'bs1_b', width: 10 },
      { header: 'BS1 Girls', key: 'bs1_g', width: 10 },
      { header: 'BS1 Total', key: 'bs1_tot', width: 11 },
      { header: 'BS2 Boys', key: 'bs2_b', width: 10 },
      { header: 'BS2 Girls', key: 'bs2_g', width: 10 },
      { header: 'BS2 Total', key: 'bs2_tot', width: 11 },
      { header: 'BS3 Boys', key: 'bs3_b', width: 10 },
      { header: 'BS3 Girls', key: 'bs3_g', width: 10 },
      { header: 'BS3 Total', key: 'bs3_tot', width: 11 },
      { header: 'BS4 Boys', key: 'bs4_b', width: 10 },
      { header: 'BS4 Girls', key: 'bs4_g', width: 10 },
      { header: 'BS4 Total', key: 'bs4_tot', width: 11 },
      { header: 'BS5 Boys', key: 'bs5_b', width: 10 },
      { header: 'BS5 Girls', key: 'bs5_g', width: 10 },
      { header: 'BS5 Total', key: 'bs5_tot', width: 11 },
      { header: 'BS6 Boys', key: 'bs6_b', width: 10 },
      { header: 'BS6 Girls', key: 'bs6_g', width: 10 },
      { header: 'BS6 Total', key: 'bs6_tot', width: 11 },
      { header: 'Primary Total Enrolment', key: 'primary_tot', width: 18 },
      { header: 'Primary Trained Teachers', key: 'primary_trained', width: 18 },
      { header: 'Primary Untrained Teachers', key: 'primary_untrained', width: 18 },
      // JHS
      { header: 'JHS1 Boys', key: 'jhs1_b', width: 12 },
      { header: 'JHS1 Girls', key: 'jhs1_g', width: 12 },
      { header: 'JHS1 Total', key: 'jhs1_tot', width: 12 },
      { header: 'JHS2 Boys', key: 'jhs2_b', width: 12 },
      { header: 'JHS2 Girls', key: 'jhs2_g', width: 12 },
      { header: 'JHS2 Total', key: 'jhs2_tot', width: 12 },
      { header: 'JHS3 Boys', key: 'jhs3_b', width: 12 },
      { header: 'JHS3 Girls', key: 'jhs3_g', width: 12 },
      { header: 'JHS3 Total', key: 'jhs3_tot', width: 12 },
      { header: 'JHS Total Enrolment', key: 'jhs_tot', width: 16 },
      { header: 'JHS Total Teachers', key: 'jhs_teachers_tot', width: 16 },
      { header: 'French Teacher', key: 'french_teacher', width: 14 },
      { header: 'Arabic Teacher', key: 'arabic_teacher', width: 14 },
      // Grand Enrolment
      { header: 'Grand Total Boys', key: 'grand_boys', width: 16 },
      { header: 'Grand Total Girls', key: 'grand_girls', width: 16 },
      { header: 'Grand Total Pupils', key: 'grand_pupils', width: 18 },
      // Facilities
      { header: 'Permanent Classrooms', key: 'perm_classrooms', width: 18 },
      { header: 'Good Condition Classrooms', key: 'good_classrooms', width: 20 },
      { header: 'Dilapidated Classrooms', key: 'dilap_classrooms', width: 18 },
      { header: 'Classes Under Tree', key: 'under_tree', width: 16 },
      { header: 'Total Mono Desks', key: 'mono_desks', width: 16 },
      { header: 'Total Dual Desks', key: 'dual_desks', width: 16 },
      { header: 'Other Desks / Chairs', key: 'other_desks', width: 18 },
      // Infrastructure
      { header: 'ICT Lab', key: 'ict_lab', width: 12 },
      { header: 'Staff Common Room', key: 'common_room', width: 16 },
      { header: 'Library', key: 'library', width: 12 },
      { header: 'Electricity', key: 'electricity', width: 12 },
      { header: 'Potable Water', key: 'water', width: 14 },
      { header: 'Toilet Facility Owned', key: 'toilet', width: 18 },
      { header: 'Urinal Facility Owned', key: 'urinal', width: 18 },
    ];

    // Style master header row
    const masterHeader = masterSheet.getRow(1);
    masterHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    masterHeader.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0A2A66' }, // Navy Brand
    };

    schools?.forEach((school) => {
      const sub = submissionMap.get(school.id);

      // Enrolment extraction
      const getEnrolment = (level: string, className: string, gender: string) => {
        if (!sub) return 0;
        const rec = sub.enrolment?.find(
          (e: any) =>
            e.level === level &&
            e.class_name?.toUpperCase() === className.toUpperCase() &&
            e.gender === gender &&
            e.age_band === 'all'
        );
        return rec?.count || 0;
      };

      const crecheB = getEnrolment('creche', 'creche', 'male');
      const crecheG = getEnrolment('creche', 'creche', 'female');

      const kg1B = getEnrolment('kg', 'KG1', 'male');
      const kg1G = getEnrolment('kg', 'KG1', 'female');
      const kg2B = getEnrolment('kg', 'KG2', 'male');
      const kg2G = getEnrolment('kg', 'KG2', 'female');

      const bs1B = getEnrolment('primary', 'BS1', 'male');
      const bs1G = getEnrolment('primary', 'BS1', 'female');
      const bs2B = getEnrolment('primary', 'BS2', 'male');
      const bs2G = getEnrolment('primary', 'BS2', 'female');
      const bs3B = getEnrolment('primary', 'BS3', 'male');
      const bs3G = getEnrolment('primary', 'BS3', 'female');
      const bs4B = getEnrolment('primary', 'BS4', 'male');
      const bs4G = getEnrolment('primary', 'BS4', 'female');
      const bs5B = getEnrolment('primary', 'BS5', 'male');
      const bs5G = getEnrolment('primary', 'BS5', 'female');
      const bs6B = getEnrolment('primary', 'BS6', 'male');
      const bs6G = getEnrolment('primary', 'BS6', 'female');

      const jhs1B = getEnrolment('jhs', 'JHS1', 'male');
      const jhs1G = getEnrolment('jhs', 'JHS1', 'female');
      const jhs2B = getEnrolment('jhs', 'JHS2', 'male');
      const jhs2G = getEnrolment('jhs', 'JHS2', 'female');
      const jhs3B = getEnrolment('jhs', 'JHS3', 'male');
      const jhs3G = getEnrolment('jhs', 'JHS3', 'female');

      const totalBoys =
        crecheB + kg1B + kg2B + bs1B + bs2B + bs3B + bs4B + bs5B + bs6B + jhs1B + jhs2B + jhs3B;
      const totalGirls =
        crecheG + kg1G + kg2G + bs1G + bs2G + bs3G + bs4G + bs5G + bs6G + jhs1G + jhs2G + jhs3G;

      // Classrooms
      let permC = 0, goodC = 0, dilapC = 0, treeC = 0;
      sub?.classrooms?.forEach((c: any) => {
        permC += c.permanent || 0;
        goodC += c.good_condition || 0;
        dilapC += c.dilapidated || 0;
        treeC += c.under_tree || 0;
      });

      // Furniture
      let monoD = 0, dualD = 0, otherD = 0;
      sub?.furniture?.forEach((f: any) => {
        if (f.furniture_type === 'mono_desk') monoD += f.count || 0;
        if (f.furniture_type === 'dual_desk') dualD += f.count || 0;
        if (f.furniture_type === 'others') otherD += f.count || 0;
      });

      // Infrastructure
      const inf = sub?.infrastructure?.[0];

      masterSheet.addRow({
        login_id: school.school_login_id,
        school_name: school.name,
        circuit: school.circuits?.name || 'Unassigned',
        status: school.status.toUpperCase(),
        emis_code: sub?.emis_code || school.emis_code || '1066329999',
        town: sub?.town || school.town || 'N/A',
        year_est: sub?.established_year || 'N/A',
        sub_status: sub?.status ? sub.status.toUpperCase() : 'NOT STARTED',
        submitted_at: sub?.submitted_at ? new Date(sub.submitted_at).toLocaleString() : 'N/A',
        ht_name: sub?.headteacher_name || school.headteacher_name || 'N/A',
        ht_phone: sub?.headteacher_phone || school.headteacher_phone || 'N/A',
        asst_name: sub?.assistant_name || school.assistant_headteacher_name || 'N/A',
        asst_phone: sub?.assistant_phone || school.assistant_headteacher_phone || 'N/A',
        tot_teachers: sub?.total_teachers || 0,
        male_teachers: sub?.male_teachers || 0,
        female_teachers: sub?.female_teachers || 0,
        creche_b: crecheB,
        creche_g: crecheG,
        creche_tot: crecheB + crecheG,
        kg1_b: kg1B,
        kg1_g: kg1G,
        kg1_tot: kg1B + kg1G,
        kg2_b: kg2B,
        kg2_g: kg2G,
        kg2_tot: kg2B + kg2G,
        kg_tot: kg1B + kg1G + kg2B + kg2G,
        kg_trained: sub?.teachers?.filter((t: any) => t.level === 'kg' && t.is_trained).reduce((a: number, b: any) => a + b.count, 0) || 0,
        kg_untrained: sub?.teachers?.filter((t: any) => t.level === 'kg' && !t.is_trained).reduce((a: number, b: any) => a + b.count, 0) || 0,
        bs1_b: bs1B,
        bs1_g: bs1G,
        bs1_tot: bs1B + bs1G,
        bs2_b: bs2B,
        bs2_g: bs2G,
        bs2_tot: bs2B + bs2G,
        bs3_b: bs3B,
        bs3_g: bs3G,
        bs3_tot: bs3B + bs3G,
        bs4_b: bs4B,
        bs4_g: bs4G,
        bs4_tot: bs4B + bs4G,
        bs5_b: bs5B,
        bs5_g: bs5G,
        bs5_tot: bs5B + bs5G,
        bs6_b: bs6B,
        bs6_g: bs6G,
        bs6_tot: bs6B + bs6G,
        primary_tot: bs1B + bs1G + bs2B + bs2G + bs3B + bs3G + bs4B + bs4G + bs5B + bs5G + bs6B + bs6G,
        primary_trained: sub?.teachers?.filter((t: any) => t.level === 'primary' && t.is_trained).reduce((a: number, b: any) => a + b.count, 0) || 0,
        primary_untrained: sub?.teachers?.filter((t: any) => t.level === 'primary' && !t.is_trained).reduce((a: number, b: any) => a + b.count, 0) || 0,
        jhs1_b: jhs1B,
        jhs1_g: jhs1G,
        jhs1_tot: jhs1B + jhs1G,
        jhs2_b: jhs2B,
        jhs2_g: jhs2G,
        jhs2_tot: jhs2B + jhs2G,
        jhs3_b: jhs3B,
        jhs3_g: jhs3G,
        jhs3_tot: jhs3B + jhs3G,
        jhs_tot: jhs1B + jhs1G + jhs2B + jhs2G + jhs3B + jhs3G,
        jhs_teachers_tot: sub?.teachers?.filter((t: any) => t.level === 'jhs').reduce((a: number, b: any) => a + b.count, 0) || 0,
        french_teacher: sub?.special_teachers?.find((st: any) => st.subject === 'french')?.has_teacher ? 'YES' : 'NO',
        arabic_teacher: sub?.special_teachers?.find((st: any) => st.subject === 'arabic')?.has_teacher ? 'YES' : 'NO',
        grand_boys: totalBoys,
        grand_girls: totalGirls,
        grand_pupils: totalBoys + totalGirls,
        perm_classrooms: permC,
        good_classrooms: goodC,
        dilap_classrooms: dilapC,
        under_tree: treeC,
        mono_desks: monoD,
        dual_desks: dualD,
        other_desks: otherD,
        ict_lab: inf?.ict_lab || 'N/A',
        common_room: inf?.staff_common_room ? 'YES' : 'NO',
        library: inf?.library || 'N/A',
        electricity: inf?.electricity ? 'YES' : 'NO',
        water: inf?.potable_water ? 'YES' : 'NO',
        toilet: inf?.toilet_facility ? 'YES' : 'NO',
        urinal: inf?.urinal_facility ? 'YES' : 'NO',
      });
    });

    // ==========================================
    // 2. CIRCUIT SUMMARY TOTALS SHEET
    // ==========================================
    const circuitSheet = workbook.addWorksheet('Circuit Summary Totals');
    circuitSheet.columns = [
      { header: 'Circuit Name', key: 'circuit_name', width: 22 },
      { header: 'Total Schools', key: 'total_schools', width: 14 },
      { header: 'Submitted Schools', key: 'submitted_schools', width: 18 },
      { header: 'Completion Rate', key: 'completion_rate', width: 16 },
      { header: 'Total Enrolment', key: 'total_pupils', width: 16 },
      { header: 'Total Boys', key: 'total_boys', width: 14 },
      { header: 'Total Girls', key: 'total_girls', width: 14 },
      { header: 'Total Teachers', key: 'total_teachers', width: 14 },
      { header: 'Permanent Classrooms', key: 'perm_classrooms', width: 20 },
      { header: 'Dilapidated Classrooms', key: 'dilap_classrooms', width: 20 },
    ];

    const cHeader = circuitSheet.getRow(1);
    cHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cHeader.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF123B86' },
    };

    circuits?.forEach((c) => {
      const cSchools = schools?.filter((s) => s.circuit_id === c.id) || [];
      const cSubs = cSchools.map((s) => submissionMap.get(s.id)).filter((sub) => sub?.status === 'submitted');

      let cPupils = 0, cBoys = 0, cGirls = 0, cTeachers = 0, cPerm = 0, cDilap = 0;

      cSubs.forEach((sub) => {
        sub.enrolment?.forEach((e: any) => {
          if (e.age_band === 'all') {
            if (e.gender === 'male') cBoys += e.count;
            if (e.gender === 'female') cGirls += e.count;
            cPupils += e.count;
          }
        });
        cTeachers += sub.total_teachers || 0;
        sub.classrooms?.forEach((cl: any) => {
          cPerm += cl.permanent || 0;
          cDilap += cl.dilapidated || 0;
        });
      });

      const rate = cSchools.length > 0 ? Math.round((cSubs.length / cSchools.length) * 100) : 0;

      circuitSheet.addRow({
        circuit_name: c.name,
        total_schools: cSchools.length,
        submitted_schools: cSubs.length,
        completion_rate: `${rate}%`,
        total_pupils: cPupils,
        total_boys: cBoys,
        total_girls: cGirls,
        total_teachers: cTeachers,
        perm_classrooms: cPerm,
        dilap_classrooms: cDilap,
      });
    });

    // ==========================================
    // 3. NON-SUBMITTERS LIST SHEET
    // ==========================================
    const nonSubmittersSheet = workbook.addWorksheet('Non-Submitters Contact List');
    nonSubmittersSheet.columns = [
      { header: 'School Name', key: 'school_name', width: 32 },
      { header: 'Circuit', key: 'circuit', width: 20 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Headteacher Name', key: 'ht_name', width: 24 },
      { header: 'Headteacher Phone Number', key: 'ht_phone', width: 22 },
      { header: 'Assistant Phone', key: 'asst_phone', width: 20 },
      { header: 'Current Progress', key: 'progress', width: 16 },
    ];

    const nsHeader = nonSubmittersSheet.getRow(1);
    nsHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    nsHeader.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFB42318' }, // Error Brand
    };

    schools
      ?.filter((s) => {
        const sub = submissionMap.get(s.id);
        return !sub || sub.status !== 'submitted';
      })
      .forEach((s) => {
        const sub = submissionMap.get(s.id);
        nonSubmittersSheet.addRow({
          school_name: s.name,
          circuit: s.circuits?.name || 'Unassigned',
          status: s.status.toUpperCase(),
          ht_name: s.headteacher_name || 'N/A',
          ht_phone: s.headteacher_phone || 'N/A',
          asst_phone: s.assistant_headteacher_phone || 'N/A',
          progress: sub?.status === 'draft' ? 'DRAFT SAVED' : 'NOT STARTED',
        });
      });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    const safeTitle = targetRound.title.replace(/[^a-zA-Z0-9]/g, '_');
    return new NextResponse(buffer, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="AMDEMIS_Master_Report_${safeTitle}.xlsx"`,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
