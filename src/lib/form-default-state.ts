import { FormWizardState, School } from '@/types';
import { LevelId } from './levels-config';

export function getInitialFormData(school?: Partial<School>): FormWizardState {
  const startingLevels: LevelId[] =
    school?.default_levels && school.default_levels.length > 0
      ? school.default_levels
      : ['primary'];

  return {
    school_details: {
      chosen_levels: startingLevels,
      emis_code: school?.emis_code || '',
      established_year: '',
      headteacher_name: school?.headteacher_name || '',
      headteacher_phone: school?.headteacher_phone || '',
      assistant_name: school?.assistant_headteacher_name || '',
      assistant_phone: school?.assistant_headteacher_phone || '',
      total_teachers: '',
      male_teachers: '',
      female_teachers: '',
      town: school?.town || '',
    },
    creche: {
      boys: '',
      girls: '',
      male_teachers: '',
      female_teachers: '',
      classrooms: {
        permanent: '',
        good_condition: '',
        dilapidated: '',
        under_tree: '',
      },
      furniture: {
        mono_desk: '',
        dual_desk: '',
        others: '',
      },
    },
    kg: {
      enrolment: {
        kg1_boys: '',
        kg1_girls: '',
        kg2_boys: '',
        kg2_girls: '',
        kg1_boys_age4: '',
        kg1_girls_age4: '',
        kg2_boys_age5: '',
        kg2_girls_age5: '',
        kg_boys_age4_5: '',
        kg_girls_age4_5: '',
      },
      teachers: {
        kg1_teachers: '',
        kg2_teachers: '',
        trained_male: '',
        trained_female: '',
        untrained_male: '',
        untrained_female: '',
      },
      classrooms: {
        permanent: '',
        good_condition: '',
        dilapidated: '',
        under_tree: '',
      },
      furniture: {
        mono_desk: '',
        dual_desk: '',
        others: '',
      },
    },
    primary: {
      enrolment: {
        bs1_boys: '',
        bs1_girls: '',
        bs2_boys: '',
        bs2_girls: '',
        bs3_boys: '',
        bs3_girls: '',
        bs4_boys: '',
        bs4_girls: '',
        bs5_boys: '',
        bs5_girls: '',
        bs6_boys: '',
        bs6_girls: '',
        bs1_boys_age6: '',
        bs1_girls_age6: '',
        bs_boys_age6_11: '',
        bs_girls_age6_11: '',
      },
      teachers_per_class: {
        bs1: '',
        bs2: '',
        bs3: '',
        bs4: '',
        bs5: '',
        bs6: '',
      },
      teachers_summary: {
        trained_male: '',
        trained_female: '',
        untrained_male: '',
        untrained_female: '',
      },
      bs_detail: {
        bs1: { trained_m: '', trained_f: '', untrained_m: '', untrained_f: '' },
        bs2: { trained_m: '', trained_f: '', untrained_m: '', untrained_f: '' },
        bs3: { trained_m: '', trained_f: '', untrained_m: '', untrained_f: '' },
      },
      classrooms: {
        permanent: '',
        good_condition: '',
        dilapidated: '',
        under_tree: '',
      },
      furniture: {
        mono_desk: '',
        dual_desk: '',
        others: '',
      },
      payroll: {
        male: '',
        female: '',
      },
    },
    jhs: {
      enrolment: {
        jhs1_boys: '',
        jhs1_girls: '',
        jhs2_boys: '',
        jhs2_girls: '',
        jhs3_boys: '',
        jhs3_girls: '',
        jhs1_boys_age12: '',
        jhs1_girls_age12: '',
        jhs_boys_age12_14: '',
        jhs_girls_age12_14: '',
      },
      total_jhs_teachers: '',
      special_teachers: {
        has_french: false,
        has_arabic: false,
      },
      teachers_summary: {
        trained_male: '',
        trained_female: '',
        untrained_male: '',
        untrained_female: '',
      },
      classrooms: {
        permanent: '',
        good_condition: '',
        dilapidated: '',
        under_tree: '',
      },
      furniture: {
        mono_desk: '',
        dual_desk: '',
        others: '',
      },
      payroll: {
        male: '',
        female: '',
      },
    },
    infrastructure: {
      ict_lab: 'N/A',
      staff_common_room: false,
      library: 'N/A',
      electricity: false,
      potable_water: false,
      toilet_facility: false,
      urinal_facility: false,
    },
    confirmed: false,
  };
}
