import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { FormWizardState } from '@/types';
import { calculateTotals } from '@/lib/schemas/submission';

export async function POST(request: NextRequest) {
  try {
    const { formData, roundId } = (await request.json()) as {
      formData: FormWizardState;
      roundId: string;
    };

    if (!formData.confirmed) {
      return NextResponse.json(
        { error: 'You must confirm the accuracy of your figures before submitting.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('school_id, full_name, schools(*, circuits(*))')
      .eq('id', user.id)
      .single();

    if (!profile?.school_id) {
      return NextResponse.json({ error: 'No school linked to this account' }, { status: 403 });
    }

    const schoolId = profile.school_id;

    // Verify round is active and not locked
    const { data: round } = await supabase
      .from('rounds')
      .select('id, title, is_active, is_locked, deadline')
      .eq('id', roundId)
      .single();

    if (round && (!round.is_active || round.is_locked)) {
      return NextResponse.json(
        { error: 'This collection round is currently locked or closed for new submissions.' },
        { status: 403 }
      );
    }

    const now = new Date().toISOString();
    const chosenLevels = formData.school_details.chosen_levels || [];

    // 1. Upsert submission record with status 'submitted'
    const { data: submission, error: subError } = await supabase
      .from('submissions')
      .upsert(
        {
          school_id: schoolId,
          round_id: roundId,
          status: 'submitted',
          established_year: formData.school_details.established_year,
          headteacher_name: formData.school_details.headteacher_name,
          headteacher_phone: formData.school_details.headteacher_phone,
          assistant_name: formData.school_details.assistant_name,
          assistant_phone: formData.school_details.assistant_phone,
          total_teachers: Number(formData.school_details.total_teachers) || 0,
          male_teachers: Number(formData.school_details.male_teachers) || 0,
          female_teachers: Number(formData.school_details.female_teachers) || 0,
          town: formData.school_details.town,
          submitted_at: now,
          updated_at: now,
        },
        { onConflict: 'school_id,round_id' }
      )
      .select('id')
      .single();

    if (subError || !submission) {
      return NextResponse.json({ error: subError?.message || 'Error submitting data' }, { status: 500 });
    }

    const submissionId = submission.id;

    // 2. Sync chosen levels
    await supabase.from('submission_levels').delete().eq('submission_id', submissionId);
    if (chosenLevels.length > 0) {
      await supabase.from('submission_levels').insert(
        chosenLevels.map((lvl) => ({
          submission_id: submissionId,
          level: lvl,
        }))
      );
    }

    // 3. Normalized Enrolment records
    await supabase.from('enrolment').delete().eq('submission_id', submissionId);
    const enrolmentRows = [];

    if (chosenLevels.includes('creche')) {
      enrolmentRows.push(
        { submission_id: submissionId, level: 'creche', class_name: 'creche', gender: 'male', age_band: 'all', count: Number(formData.creche.boys) || 0 },
        { submission_id: submissionId, level: 'creche', class_name: 'creche', gender: 'female', age_band: 'all', count: Number(formData.creche.girls) || 0 }
      );
    }

    if (chosenLevels.includes('kg')) {
      const e = formData.kg.enrolment;
      enrolmentRows.push(
        { submission_id: submissionId, level: 'kg', class_name: 'KG1', gender: 'male', age_band: 'all', count: Number(e.kg1_boys) || 0 },
        { submission_id: submissionId, level: 'kg', class_name: 'KG1', gender: 'female', age_band: 'all', count: Number(e.kg1_girls) || 0 },
        { submission_id: submissionId, level: 'kg', class_name: 'KG2', gender: 'male', age_band: 'all', count: Number(e.kg2_boys) || 0 },
        { submission_id: submissionId, level: 'kg', class_name: 'KG2', gender: 'female', age_band: 'all', count: Number(e.kg2_girls) || 0 },
        { submission_id: submissionId, level: 'kg', class_name: 'KG1', gender: 'male', age_band: 'age_4', count: Number(e.kg1_boys_age4) || 0 },
        { submission_id: submissionId, level: 'kg', class_name: 'KG1', gender: 'female', age_band: 'age_4', count: Number(e.kg1_girls_age4) || 0 },
        { submission_id: submissionId, level: 'kg', class_name: 'KG2', gender: 'male', age_band: 'age_5', count: Number(e.kg2_boys_age5) || 0 },
        { submission_id: submissionId, level: 'kg', class_name: 'KG2', gender: 'female', age_band: 'age_5', count: Number(e.kg2_girls_age5) || 0 },
        { submission_id: submissionId, level: 'kg', class_name: 'all', gender: 'male', age_band: 'age_4_5', count: Number(e.kg_boys_age4_5) || 0 },
        { submission_id: submissionId, level: 'kg', class_name: 'all', gender: 'female', age_band: 'age_4_5', count: Number(e.kg_girls_age4_5) || 0 }
      );
    }

    if (chosenLevels.includes('primary')) {
      const p = formData.primary.enrolment;
      const bsClasses = ['bs1', 'bs2', 'bs3', 'bs4', 'bs5', 'bs6'] as const;
      bsClasses.forEach((c) => {
        enrolmentRows.push(
          { submission_id: submissionId, level: 'primary', class_name: c.toUpperCase(), gender: 'male', age_band: 'all', count: Number(p[`${c}_boys`]) || 0 },
          { submission_id: submissionId, level: 'primary', class_name: c.toUpperCase(), gender: 'female', age_band: 'all', count: Number(p[`${c}_girls`]) || 0 }
        );
      });
      enrolmentRows.push(
        { submission_id: submissionId, level: 'primary', class_name: 'BS1', gender: 'male', age_band: 'age_6', count: Number(p.bs1_boys_age6) || 0 },
        { submission_id: submissionId, level: 'primary', class_name: 'BS1', gender: 'female', age_band: 'age_6', count: Number(p.bs1_girls_age6) || 0 },
        { submission_id: submissionId, level: 'primary', class_name: 'all', gender: 'male', age_band: 'age_6_11', count: Number(p.bs_boys_age6_11) || 0 },
        { submission_id: submissionId, level: 'primary', class_name: 'all', gender: 'female', age_band: 'age_6_11', count: Number(p.bs_girls_age6_11) || 0 }
      );
    }

    if (chosenLevels.includes('jhs')) {
      const j = formData.jhs.enrolment;
      const jClasses = ['jhs1', 'jhs2', 'jhs3'] as const;
      jClasses.forEach((c) => {
        enrolmentRows.push(
          { submission_id: submissionId, level: 'jhs', class_name: c.toUpperCase(), gender: 'male', age_band: 'all', count: Number(j[`${c}_boys`]) || 0 },
          { submission_id: submissionId, level: 'jhs', class_name: c.toUpperCase(), gender: 'female', age_band: 'all', count: Number(j[`${c}_girls`]) || 0 }
        );
      });
      enrolmentRows.push(
        { submission_id: submissionId, level: 'jhs', class_name: 'JHS1', gender: 'male', age_band: 'age_12', count: Number(j.jhs1_boys_age12) || 0 },
        { submission_id: submissionId, level: 'jhs', class_name: 'JHS1', gender: 'female', age_band: 'age_12', count: Number(j.jhs1_girls_age12) || 0 },
        { submission_id: submissionId, level: 'jhs', class_name: 'all', gender: 'male', age_band: 'age_12_14', count: Number(j.jhs_boys_age12_14) || 0 },
        { submission_id: submissionId, level: 'jhs', class_name: 'all', gender: 'female', age_band: 'age_12_14', count: Number(j.jhs_girls_age12_14) || 0 }
      );
    }

    if (enrolmentRows.length > 0) {
      await supabase.from('enrolment').insert(enrolmentRows);
    }

    // 4. Normalized Teachers records
    await supabase.from('teachers').delete().eq('submission_id', submissionId);
    const teacherRows = [];

    if (chosenLevels.includes('creche')) {
      teacherRows.push(
        { submission_id: submissionId, level: 'creche', class_name: 'all', gender: 'male', is_trained: true, count: Number(formData.creche.male_teachers) || 0 },
        { submission_id: submissionId, level: 'creche', class_name: 'all', gender: 'female', is_trained: true, count: Number(formData.creche.female_teachers) || 0 }
      );
    }

    if (chosenLevels.includes('kg')) {
      const t = formData.kg.teachers;
      teacherRows.push(
        { submission_id: submissionId, level: 'kg', class_name: 'all', gender: 'male', is_trained: true, count: Number(t.trained_male) || 0 },
        { submission_id: submissionId, level: 'kg', class_name: 'all', gender: 'female', is_trained: true, count: Number(t.trained_female) || 0 },
        { submission_id: submissionId, level: 'kg', class_name: 'all', gender: 'male', is_trained: false, count: Number(t.untrained_male) || 0 },
        { submission_id: submissionId, level: 'kg', class_name: 'all', gender: 'female', is_trained: false, count: Number(t.untrained_female) || 0 }
      );
    }

    if (chosenLevels.includes('primary')) {
      const t = formData.primary.teachers_summary;
      teacherRows.push(
        { submission_id: submissionId, level: 'primary', class_name: 'all', gender: 'male', is_trained: true, count: Number(t.trained_male) || 0 },
        { submission_id: submissionId, level: 'primary', class_name: 'all', gender: 'female', is_trained: true, count: Number(t.trained_female) || 0 },
        { submission_id: submissionId, level: 'primary', class_name: 'all', gender: 'male', is_trained: false, count: Number(t.untrained_male) || 0 },
        { submission_id: submissionId, level: 'primary', class_name: 'all', gender: 'female', is_trained: false, count: Number(t.untrained_female) || 0 }
      );
    }

    if (chosenLevels.includes('jhs')) {
      const t = formData.jhs.teachers_summary;
      teacherRows.push(
        { submission_id: submissionId, level: 'jhs', class_name: 'all', gender: 'male', is_trained: true, count: Number(t.trained_male) || 0 },
        { submission_id: submissionId, level: 'jhs', class_name: 'all', gender: 'female', is_trained: true, count: Number(t.trained_female) || 0 },
        { submission_id: submissionId, level: 'jhs', class_name: 'all', gender: 'male', is_trained: false, count: Number(t.untrained_male) || 0 },
        { submission_id: submissionId, level: 'jhs', class_name: 'all', gender: 'female', is_trained: false, count: Number(t.untrained_female) || 0 }
      );
    }

    if (teacherRows.length > 0) {
      await supabase.from('teachers').insert(teacherRows);
    }

    // 5. Normalized Classrooms records
    await supabase.from('classrooms').delete().eq('submission_id', submissionId);
    const classroomRows = [];
    if (chosenLevels.includes('creche')) {
      classroomRows.push({
        submission_id: submissionId,
        level: 'creche',
        permanent: Number(formData.creche.classrooms.permanent) || 0,
        good_condition: Number(formData.creche.classrooms.good_condition) || 0,
        dilapidated: Number(formData.creche.classrooms.dilapidated) || 0,
        under_tree: Number(formData.creche.classrooms.under_tree) || 0,
      });
    }
    if (chosenLevels.includes('kg')) {
      classroomRows.push({
        submission_id: submissionId,
        level: 'kg',
        permanent: Number(formData.kg.classrooms.permanent) || 0,
        good_condition: Number(formData.kg.classrooms.good_condition) || 0,
        dilapidated: Number(formData.kg.classrooms.dilapidated) || 0,
        under_tree: Number(formData.kg.classrooms.under_tree) || 0,
      });
    }
    if (chosenLevels.includes('primary')) {
      classroomRows.push({
        submission_id: submissionId,
        level: 'primary',
        permanent: Number(formData.primary.classrooms.permanent) || 0,
        good_condition: Number(formData.primary.classrooms.good_condition) || 0,
        dilapidated: Number(formData.primary.classrooms.dilapidated) || 0,
        under_tree: Number(formData.primary.classrooms.under_tree) || 0,
      });
    }
    if (chosenLevels.includes('jhs')) {
      classroomRows.push({
        submission_id: submissionId,
        level: 'jhs',
        permanent: Number(formData.jhs.classrooms.permanent) || 0,
        good_condition: Number(formData.jhs.classrooms.good_condition) || 0,
        dilapidated: Number(formData.jhs.classrooms.dilapidated) || 0,
        under_tree: Number(formData.jhs.classrooms.under_tree) || 0,
      });
    }
    if (classroomRows.length > 0) {
      await supabase.from('classrooms').insert(classroomRows);
    }

    // 6. Furniture records
    await supabase.from('furniture').delete().eq('submission_id', submissionId);
    const furnitureRows = [];
    if (chosenLevels.includes('creche')) {
      furnitureRows.push(
        { submission_id: submissionId, level: 'creche', furniture_type: 'mono_desk', count: Number(formData.creche.furniture.mono_desk) || 0 },
        { submission_id: submissionId, level: 'creche', furniture_type: 'dual_desk', count: Number(formData.creche.furniture.dual_desk) || 0 },
        { submission_id: submissionId, level: 'creche', furniture_type: 'others', count: Number(formData.creche.furniture.others) || 0 }
      );
    }
    if (chosenLevels.includes('kg')) {
      furnitureRows.push(
        { submission_id: submissionId, level: 'kg', furniture_type: 'mono_desk', count: Number(formData.kg.furniture.mono_desk) || 0 },
        { submission_id: submissionId, level: 'kg', furniture_type: 'dual_desk', count: Number(formData.kg.furniture.dual_desk) || 0 },
        { submission_id: submissionId, level: 'kg', furniture_type: 'others', count: Number(formData.kg.furniture.others) || 0 }
      );
    }
    if (chosenLevels.includes('primary')) {
      furnitureRows.push(
        { submission_id: submissionId, level: 'primary', furniture_type: 'mono_desk', count: Number(formData.primary.furniture.mono_desk) || 0 },
        { submission_id: submissionId, level: 'primary', furniture_type: 'dual_desk', count: Number(formData.primary.furniture.dual_desk) || 0 },
        { submission_id: submissionId, level: 'primary', furniture_type: 'others', count: Number(formData.primary.furniture.others) || 0 }
      );
    }
    if (chosenLevels.includes('jhs')) {
      furnitureRows.push(
        { submission_id: submissionId, level: 'jhs', furniture_type: 'mono_desk', count: Number(formData.jhs.furniture.mono_desk) || 0 },
        { submission_id: submissionId, level: 'jhs', furniture_type: 'dual_desk', count: Number(formData.jhs.furniture.dual_desk) || 0 },
        { submission_id: submissionId, level: 'jhs', furniture_type: 'others', count: Number(formData.jhs.furniture.others) || 0 }
      );
    }
    if (furnitureRows.length > 0) {
      await supabase.from('furniture').insert(furnitureRows);
    }

    // 7. Non-teaching Staff Payroll
    await supabase.from('staff_payroll').delete().eq('submission_id', submissionId);
    const payrollRows = [];
    if (chosenLevels.includes('primary') || chosenLevels.includes('kg')) {
      payrollRows.push({
        submission_id: submissionId,
        level_group: 'kg_primary',
        male_count: Number(formData.primary.payroll.male) || 0,
        female_count: Number(formData.primary.payroll.female) || 0,
      });
    }
    if (chosenLevels.includes('jhs')) {
      payrollRows.push({
        submission_id: submissionId,
        level_group: 'jhs',
        male_count: Number(formData.jhs.payroll.male) || 0,
        female_count: Number(formData.jhs.payroll.female) || 0,
      });
    }
    if (payrollRows.length > 0) {
      await supabase.from('staff_payroll').insert(payrollRows);
    }

    // 8. Special Teachers (French, Arabic)
    await supabase.from('special_teachers').delete().eq('submission_id', submissionId);
    if (chosenLevels.includes('jhs')) {
      await supabase.from('special_teachers').insert([
        { submission_id: submissionId, subject: 'french', has_teacher: formData.jhs.special_teachers.has_french },
        { submission_id: submissionId, subject: 'arabic', has_teacher: formData.jhs.special_teachers.has_arabic },
      ]);
    }

    // 9. Infrastructure
    await supabase.from('infrastructure').delete().eq('submission_id', submissionId);
    await supabase.from('infrastructure').insert({
      submission_id: submissionId,
      ict_lab: formData.infrastructure.ict_lab,
      staff_common_room: formData.infrastructure.staff_common_room,
      library: formData.infrastructure.library,
      electricity: formData.infrastructure.electricity,
      potable_water: formData.infrastructure.potable_water,
      toilet_facility: formData.infrastructure.toilet_facility,
      urinal_facility: formData.infrastructure.urinal_facility,
    });

    const totals = calculateTotals(formData);

    const schoolObj = Array.isArray(profile.schools) ? profile.schools[0] : profile.schools;
    const circuitObj = schoolObj?.circuits;
    const circuitName = Array.isArray(circuitObj) ? circuitObj[0]?.name : circuitObj?.name;

    return NextResponse.json({
      success: true,
      submissionId,
      submittedAt: now,
      schoolName: schoolObj?.name || 'School',
      circuitName: circuitName || 'Circuit',
      emisCode: formData.school_details.emis_code,
      roundTitle: round?.title || 'Academic Year',
      totalPupils: totals.grandTotalPupils,
      totalTeachers: Number(formData.school_details.total_teachers) || 0,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
