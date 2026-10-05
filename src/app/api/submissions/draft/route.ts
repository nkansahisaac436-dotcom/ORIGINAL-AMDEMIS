import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { FormWizardState } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { formData, roundId } = (await request.json()) as {
      formData: FormWizardState;
      roundId: string;
    };

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

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('school_id')
      .eq('id', user.id)
      .single();

    if (!profile?.school_id) {
      return NextResponse.json({ error: 'No school linked' }, { status: 403 });
    }

    const schoolId = profile.school_id;

    // Check if round is active
    const { data: round } = await supabase
      .from('rounds')
      .select('id, is_active, is_locked')
      .eq('id', roundId)
      .single();

    if (round && (!round.is_active || round.is_locked)) {
      return NextResponse.json({ error: 'Collection round is closed or locked' }, { status: 403 });
    }

    // Upsert submission record as draft
    const { data: submission, error: subError } = await supabase
      .from('submissions')
      .upsert(
        {
          school_id: schoolId,
          round_id: roundId,
          status: 'draft',
          established_year: formData.school_details.established_year,
          headteacher_name: formData.school_details.headteacher_name,
          headteacher_phone: formData.school_details.headteacher_phone,
          assistant_name: formData.school_details.assistant_name,
          assistant_phone: formData.school_details.assistant_phone,
          total_teachers: Number(formData.school_details.total_teachers) || 0,
          male_teachers: Number(formData.school_details.male_teachers) || 0,
          female_teachers: Number(formData.school_details.female_teachers) || 0,
          town: formData.school_details.town,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'school_id,round_id' }
      )
      .select('id')
      .single();

    if (subError || !submission) {
      return NextResponse.json({ error: subError?.message || 'Error saving draft' }, { status: 500 });
    }

    const submissionId = submission.id;

    // 1. Sync submission_levels
    await supabase.from('submission_levels').delete().eq('submission_id', submissionId);
    const chosenLevels = formData.school_details.chosen_levels || [];
    if (chosenLevels.length > 0) {
      await supabase.from('submission_levels').insert(
        chosenLevels.map((lvl) => ({
          submission_id: submissionId,
          level: lvl,
        }))
      );
    }

    // 2. Sync classrooms
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

    // 3. Sync furniture
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

    // 4. Sync infrastructure
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

    return NextResponse.json({
      success: true,
      submissionId,
      message: 'Draft saved successfully',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
