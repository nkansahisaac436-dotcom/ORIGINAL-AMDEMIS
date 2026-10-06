import { z } from 'zod';
import { FormWizardState } from '@/types';
import { LevelId } from '../levels-config';
import { getSchoolTotals } from '../enrolment-totals';

// Helper for numeric string or number coercion
const countField = z.union([z.number(), z.string()]).transform((val) => {
  if (typeof val === 'number') return isNaN(val) ? 0 : Math.max(0, Math.floor(val));
  const parsed = parseInt(val.trim(), 10);
  return isNaN(parsed) ? 0 : Math.max(0, parsed);
});

// 1. Step 1: School Details Schema
export const schoolDetailsSchema = z
  .object({
    chosen_levels: z
      .array(z.enum(['creche', 'kg', 'primary', 'jhs', 'shs']))
      .min(1, 'Please select at least one level your school runs this year'),
    emis_code: z.string().min(1, 'EMIS code is required. If none, use 1066329999'),
    established_year: z
      .string()
      .min(4, 'Enter a valid year of establishment (e.g. 1998)')
      .regex(/^\d{4}$/, 'Year must be a 4-digit number (e.g. 2005)'),
    headteacher_name: z.string().min(2, 'Full name of headteacher is required'),
    headteacher_phone: z
      .string()
      .min(10, 'Permanent contact of headteacher must be at least 10 digits')
      .regex(/^[0-9+ ]{10,15}$/, 'Enter a valid phone number (e.g. 0244123456)'),
    assistant_name: z.string().optional().default(''),
    assistant_phone: z.string().optional().default(''),
    total_teachers: countField,
    male_teachers: countField,
    female_teachers: countField,
    town: z.string().optional().default(''),
    is_private: z.boolean().optional().default(false),
  })
  .refine(
    (data) => {
      const male = typeof data.male_teachers === 'number' ? data.male_teachers : 0;
      const female = typeof data.female_teachers === 'number' ? data.female_teachers : 0;
      const total = typeof data.total_teachers === 'number' ? data.total_teachers : 0;
      return male + female === total;
    },
    {
      message: 'Total teachers must equal Male teachers + Female teachers',
      path: ['total_teachers'],
    }
  )
  .refine(
    (data) => {
      if (data.is_private && (!data.town || data.town.trim().length === 0)) {
        return false;
      }
      return true;
    },
    {
      message: 'Town/location is required for private schools',
      path: ['town'],
    }
  );

// 2. Crèche Section Schema
export const crecheSectionSchema = z
  .object({
    boys: countField,
    girls: countField,
    male_teachers: countField,
    female_teachers: countField,
    classrooms: z.object({
      permanent: countField,
      good_condition: countField,
      dilapidated: countField,
      under_tree: countField.default(0),
    }),
    furniture: z.object({
      mono_desk: countField,
      dual_desk: countField,
      others: countField,
    }),
  })
  .refine(
    (data) => {
      const perm = Number(data.classrooms.permanent);
      const good = Number(data.classrooms.good_condition);
      const dilap = Number(data.classrooms.dilapidated);
      return good + dilap <= perm;
    },
    {
      message: 'Good condition + Dilapidated classrooms cannot exceed Permanent classrooms',
      path: ['classrooms', 'good_condition'],
    }
  );

// 3. KG Section Schema
export const kgSectionSchema = z
  .object({
    enrolment: z.object({
      kg1_boys: countField,
      kg1_girls: countField,
      kg2_boys: countField,
      kg2_girls: countField,
      kg1_boys_age4: countField,
      kg1_girls_age4: countField,
      kg2_boys_age5: countField,
      kg2_girls_age5: countField,
      kg_boys_age4_5: countField,
      kg_girls_age4_5: countField,
    }),
    teachers: z.object({
      kg1_teachers: countField,
      kg2_teachers: countField,
      trained_male: countField,
      trained_female: countField,
      untrained_male: countField,
      untrained_female: countField,
    }),
    classrooms: z.object({
      permanent: countField,
      good_condition: countField,
      dilapidated: countField,
      under_tree: countField.default(0),
    }),
    furniture: z.object({
      mono_desk: countField,
      dual_desk: countField,
      others: countField,
    }),
  })
  .refine(
    (data) => {
      const kg1_b = Number(data.enrolment.kg1_boys);
      const kg1_b_age4 = Number(data.enrolment.kg1_boys_age4);
      return kg1_b_age4 <= kg1_b;
    },
    {
      message: 'KG1 Boys aged 4 cannot exceed total KG1 Boys',
      path: ['enrolment', 'kg1_boys_age4'],
    }
  )
  .refine(
    (data) => {
      const kg1_g = Number(data.enrolment.kg1_girls);
      const kg1_g_age4 = Number(data.enrolment.kg1_girls_age4);
      return kg1_g_age4 <= kg1_g;
    },
    {
      message: 'KG1 Girls aged 4 cannot exceed total KG1 Girls',
      path: ['enrolment', 'kg1_girls_age4'],
    }
  )
  .refine(
    (data) => {
      const kg2_b = Number(data.enrolment.kg2_boys);
      const kg2_b_age5 = Number(data.enrolment.kg2_boys_age5);
      return kg2_b_age5 <= kg2_b;
    },
    {
      message: 'KG2 Boys aged 5 cannot exceed total KG2 Boys',
      path: ['enrolment', 'kg2_boys_age5'],
    }
  )
  .refine(
    (data) => {
      const kg2_g = Number(data.enrolment.kg2_girls);
      const kg2_g_age5 = Number(data.enrolment.kg2_girls_age5);
      return kg2_g_age5 <= kg2_g;
    },
    {
      message: 'KG2 Girls aged 5 cannot exceed total KG2 Girls',
      path: ['enrolment', 'kg2_girls_age5'],
    }
  )
  .refine(
    (data) => {
      const total_kg_b = Number(data.enrolment.kg1_boys) + Number(data.enrolment.kg2_boys);
      const kg_b_age4_5 = Number(data.enrolment.kg_boys_age4_5);
      return kg_b_age4_5 <= total_kg_b;
    },
    {
      message: 'KG Boys aged 4 to 5 cannot exceed total KG Boys',
      path: ['enrolment', 'kg_boys_age4_5'],
    }
  )
  .refine(
    (data) => {
      const total_kg_g = Number(data.enrolment.kg1_girls) + Number(data.enrolment.kg2_girls);
      const kg_g_age4_5 = Number(data.enrolment.kg_girls_age4_5);
      return kg_g_age4_5 <= total_kg_g;
    },
    {
      message: 'KG Girls aged 4 to 5 cannot exceed total KG Girls',
      path: ['enrolment', 'kg_girls_age4_5'],
    }
  )
  .refine(
    (data) => {
      const classTeachers = Number(data.teachers.kg1_teachers) + Number(data.teachers.kg2_teachers);
      const trainingTeachers =
        Number(data.teachers.trained_male) +
        Number(data.teachers.trained_female) +
        Number(data.teachers.untrained_male) +
        Number(data.teachers.untrained_female);
      return classTeachers === trainingTeachers;
    },
    {
      message: 'Total KG class teachers (KG1 + KG2) must match trained + untrained teachers',
      path: ['teachers', 'trained_male'],
    }
  )
  .refine(
    (data) => {
      const perm = Number(data.classrooms.permanent);
      const good = Number(data.classrooms.good_condition);
      const dilap = Number(data.classrooms.dilapidated);
      return good + dilap <= perm;
    },
    {
      message: 'Good condition + Dilapidated classrooms cannot exceed Permanent classrooms',
      path: ['classrooms', 'good_condition'],
    }
  );

// 4. Primary Section Schema
export const primarySectionSchema = z
  .object({
    enrolment: z.object({
      bs1_boys: countField,
      bs1_girls: countField,
      bs2_boys: countField,
      bs2_girls: countField,
      bs3_boys: countField,
      bs3_girls: countField,
      bs4_boys: countField,
      bs4_girls: countField,
      bs5_boys: countField,
      bs5_girls: countField,
      bs6_boys: countField,
      bs6_girls: countField,
      bs1_boys_age6: countField,
      bs1_girls_age6: countField,
      bs_boys_age6_11: countField,
      bs_girls_age6_11: countField,
    }),
    teachers_per_class: z.object({
      bs1: countField,
      bs2: countField,
      bs3: countField,
      bs4: countField,
      bs5: countField,
      bs6: countField,
    }),
    teachers_summary: z.object({
      trained_male: countField,
      trained_female: countField,
      untrained_male: countField,
      untrained_female: countField,
    }),
    bs_detail: z.object({
      bs1: z.object({
        trained_m: countField,
        trained_f: countField,
        untrained_m: countField,
        untrained_f: countField,
      }),
      bs2: z.object({
        trained_m: countField,
        trained_f: countField,
        untrained_m: countField,
        untrained_f: countField,
      }),
      bs3: z.object({
        trained_m: countField,
        trained_f: countField,
        untrained_m: countField,
        untrained_f: countField,
      }),
    }),
    classrooms: z.object({
      permanent: countField,
      good_condition: countField,
      dilapidated: countField,
      under_tree: countField.default(0),
    }),
    furniture: z.object({
      mono_desk: countField,
      dual_desk: countField,
      others: countField,
    }),
    payroll: z.object({
      male: countField,
      female: countField,
    }),
  })
  .refine(
    (data) => {
      const bs1_b = Number(data.enrolment.bs1_boys);
      const bs1_b_age6 = Number(data.enrolment.bs1_boys_age6);
      return bs1_b_age6 <= bs1_b;
    },
    {
      message: 'BS1 Boys aged 6 cannot exceed BS1 Boys',
      path: ['enrolment', 'bs1_boys_age6'],
    }
  )
  .refine(
    (data) => {
      const bs1_g = Number(data.enrolment.bs1_girls);
      const bs1_g_age6 = Number(data.enrolment.bs1_girls_age6);
      return bs1_g_age6 <= bs1_g;
    },
    {
      message: 'BS1 Girls aged 6 cannot exceed BS1 Girls',
      path: ['enrolment', 'bs1_girls_age6'],
    }
  )
  .refine(
    (data) => {
      const total_bs_b =
        Number(data.enrolment.bs1_boys) +
        Number(data.enrolment.bs2_boys) +
        Number(data.enrolment.bs3_boys) +
        Number(data.enrolment.bs4_boys) +
        Number(data.enrolment.bs5_boys) +
        Number(data.enrolment.bs6_boys);
      const bs_b_age6_11 = Number(data.enrolment.bs_boys_age6_11);
      return bs_b_age6_11 <= total_bs_b;
    },
    {
      message: 'BS1 to BS6 Boys aged 6 to 11 cannot exceed total Primary Boys',
      path: ['enrolment', 'bs_boys_age6_11'],
    }
  )
  .refine(
    (data) => {
      const total_bs_g =
        Number(data.enrolment.bs1_girls) +
        Number(data.enrolment.bs2_girls) +
        Number(data.enrolment.bs3_girls) +
        Number(data.enrolment.bs4_girls) +
        Number(data.enrolment.bs5_girls) +
        Number(data.enrolment.bs6_girls);
      const bs_g_age6_11 = Number(data.enrolment.bs_girls_age6_11);
      return bs_g_age6_11 <= total_bs_g;
    },
    {
      message: 'BS1 to BS6 Girls aged 6 to 11 cannot exceed total Primary Girls',
      path: ['enrolment', 'bs_girls_age6_11'],
    }
  )
  .refine(
    (data) => {
      const totalClassTeachers =
        Number(data.teachers_per_class.bs1) +
        Number(data.teachers_per_class.bs2) +
        Number(data.teachers_per_class.bs3) +
        Number(data.teachers_per_class.bs4) +
        Number(data.teachers_per_class.bs5) +
        Number(data.teachers_per_class.bs6);
      const totalTrainedUntrained =
        Number(data.teachers_summary.trained_male) +
        Number(data.teachers_summary.trained_female) +
        Number(data.teachers_summary.untrained_male) +
        Number(data.teachers_summary.untrained_female);
      return totalClassTeachers === totalTrainedUntrained;
    },
    {
      message: 'Primary teachers per class (BS1–BS6) must equal Primary Trained + Untrained teachers',
      path: ['teachers_summary', 'trained_male'],
    }
  )
  .refine(
    (data) => {
      const bs1Count = Number(data.teachers_per_class.bs1);
      const bs1DetailSum =
        Number(data.bs_detail.bs1.trained_m) +
        Number(data.bs_detail.bs1.trained_f) +
        Number(data.bs_detail.bs1.untrained_m) +
        Number(data.bs_detail.bs1.untrained_f);
      return bs1Count === bs1DetailSum;
    },
    {
      message: 'BS1 detail (trained/untrained M&F) must match BS1 class teacher count',
      path: ['bs_detail', 'bs1', 'trained_m'],
    }
  )
  .refine(
    (data) => {
      const bs2Count = Number(data.teachers_per_class.bs2);
      const bs2DetailSum =
        Number(data.bs_detail.bs2.trained_m) +
        Number(data.bs_detail.bs2.trained_f) +
        Number(data.bs_detail.bs2.untrained_m) +
        Number(data.bs_detail.bs2.untrained_f);
      return bs2Count === bs2DetailSum;
    },
    {
      message: 'BS2 detail (trained/untrained M&F) must match BS2 class teacher count',
      path: ['bs_detail', 'bs2', 'trained_m'],
    }
  )
  .refine(
    (data) => {
      const bs3Count = Number(data.teachers_per_class.bs3);
      const bs3DetailSum =
        Number(data.bs_detail.bs3.trained_m) +
        Number(data.bs_detail.bs3.trained_f) +
        Number(data.bs_detail.bs3.untrained_m) +
        Number(data.bs_detail.bs3.untrained_f);
      return bs3Count === bs3DetailSum;
    },
    {
      message: 'BS3 detail (trained/untrained M&F) must match BS3 class teacher count',
      path: ['bs_detail', 'bs3', 'trained_m'],
    }
  )
  .refine(
    (data) => {
      const perm = Number(data.classrooms.permanent);
      const good = Number(data.classrooms.good_condition);
      const dilap = Number(data.classrooms.dilapidated);
      return good + dilap <= perm;
    },
    {
      message: 'Good condition + Dilapidated classrooms cannot exceed Permanent classrooms',
      path: ['classrooms', 'good_condition'],
    }
  );

// 5. JHS Section Schema
export const jhsSectionSchema = z
  .object({
    enrolment: z.object({
      jhs1_boys: countField,
      jhs1_girls: countField,
      jhs2_boys: countField,
      jhs2_girls: countField,
      jhs3_boys: countField,
      jhs3_girls: countField,
      jhs1_boys_age12: countField,
      jhs1_girls_age12: countField,
      jhs_boys_age12_14: countField,
      jhs_girls_age12_14: countField,
    }),
    total_jhs_teachers: countField,
    special_teachers: z.object({
      has_french: z.boolean().default(false),
      has_arabic: z.boolean().default(false),
    }),
    teachers_summary: z.object({
      trained_male: countField,
      trained_female: countField,
      untrained_male: countField,
      untrained_female: countField,
    }),
    classrooms: z.object({
      permanent: countField,
      good_condition: countField,
      dilapidated: countField,
      under_tree: countField.default(0),
    }),
    furniture: z.object({
      mono_desk: countField,
      dual_desk: countField,
      others: countField,
    }),
    payroll: z.object({
      male: countField,
      female: countField,
    }),
  })
  .refine(
    (data) => {
      const jhs1_b = Number(data.enrolment.jhs1_boys);
      const jhs1_b_age12 = Number(data.enrolment.jhs1_boys_age12);
      return jhs1_b_age12 <= jhs1_b;
    },
    {
      message: 'JHS1 Boys aged 12 cannot exceed JHS1 Boys',
      path: ['enrolment', 'jhs1_boys_age12'],
    }
  )
  .refine(
    (data) => {
      const jhs1_g = Number(data.enrolment.jhs1_girls);
      const jhs1_g_age12 = Number(data.enrolment.jhs1_girls_age12);
      return jhs1_g_age12 <= jhs1_g;
    },
    {
      message: 'JHS1 Girls aged 12 cannot exceed JHS1 Girls',
      path: ['enrolment', 'jhs1_girls_age12'],
    }
  )
  .refine(
    (data) => {
      const total_jhs_b =
        Number(data.enrolment.jhs1_boys) +
        Number(data.enrolment.jhs2_boys) +
        Number(data.enrolment.jhs3_boys);
      const jhs_b_age12_14 = Number(data.enrolment.jhs_boys_age12_14);
      return jhs_b_age12_14 <= total_jhs_b;
    },
    {
      message: 'JHS1 to JHS3 Boys aged 12 to 14 cannot exceed total JHS Boys',
      path: ['enrolment', 'jhs_boys_age12_14'],
    }
  )
  .refine(
    (data) => {
      const total_jhs_g =
        Number(data.enrolment.jhs1_girls) +
        Number(data.enrolment.jhs2_girls) +
        Number(data.enrolment.jhs3_girls);
      const jhs_g_age12_14 = Number(data.enrolment.jhs_girls_age12_14);
      return jhs_g_age12_14 <= total_jhs_g;
    },
    {
      message: 'JHS1 to JHS3 Girls aged 12 to 14 cannot exceed total JHS Girls',
      path: ['enrolment', 'jhs_girls_age12_14'],
    }
  )
  .refine(
    (data) => {
      const totalJHSTeachers = Number(data.total_jhs_teachers);
      const totalTrainedUntrained =
        Number(data.teachers_summary.trained_male) +
        Number(data.teachers_summary.trained_female) +
        Number(data.teachers_summary.untrained_male) +
        Number(data.teachers_summary.untrained_female);
      return totalJHSTeachers === totalTrainedUntrained;
    },
    {
      message: 'Total JHS teachers must equal Trained + Untrained teachers (Male & Female)',
      path: ['teachers_summary', 'trained_male'],
    }
  )
  .refine(
    (data) => {
      const perm = Number(data.classrooms.permanent);
      const good = Number(data.classrooms.good_condition);
      const dilap = Number(data.classrooms.dilapidated);
      return good + dilap <= perm;
    },
    {
      message: 'Good condition + Dilapidated classrooms cannot exceed Permanent classrooms',
      path: ['classrooms', 'good_condition'],
    }
  );

// 6. Infrastructure Section Schema
export const infrastructureSectionSchema = z.object({
  ict_lab: z.enum(['1', 'N/A']),
  staff_common_room: z.boolean(),
  library: z.enum(['1', 'N/A']),
  electricity: z.boolean(),
  potable_water: z.boolean(),
  toilet_facility: z.boolean(),
  urinal_facility: z.boolean(),
});

// Auto-calculation functions for UI and backend
export function calculateTotals(data: FormWizardState) {
  const levels = data.school_details.chosen_levels || [];
  const schoolTotals = getSchoolTotals(data);

  const crecheBoys = levels.includes('creche') ? schoolTotals.creche.boys : 0;
  const crecheGirls = levels.includes('creche') ? schoolTotals.creche.girls : 0;
  const kgBoys = levels.includes('kg') ? schoolTotals.kg.boys : 0;
  const kgGirls = levels.includes('kg') ? schoolTotals.kg.girls : 0;
  const primaryBoys = levels.includes('primary') ? schoolTotals.primary.boys : 0;
  const primaryGirls = levels.includes('primary') ? schoolTotals.primary.girls : 0;
  const jhsBoys = levels.includes('jhs') ? schoolTotals.jhs.boys : 0;
  const jhsGirls = levels.includes('jhs') ? schoolTotals.jhs.girls : 0;

  const grandTotalBoys = schoolTotals.grandTotalBoys;
  const grandTotalGirls = schoolTotals.grandTotalGirls;
  const grandTotalPupils = schoolTotals.grandTotalPupils;

  // Teachers calculations
  let trainedTeachers = 0;
  let untrainedTeachers = 0;

  if (levels.includes('kg')) {
    trainedTeachers +=
      (Number(data.kg.teachers.trained_male) || 0) + (Number(data.kg.teachers.trained_female) || 0);
    untrainedTeachers +=
      (Number(data.kg.teachers.untrained_male) || 0) + (Number(data.kg.teachers.untrained_female) || 0);
  }

  if (levels.includes('primary')) {
    trainedTeachers +=
      (Number(data.primary.teachers_summary.trained_male) || 0) +
      (Number(data.primary.teachers_summary.trained_female) || 0);
    untrainedTeachers +=
      (Number(data.primary.teachers_summary.untrained_male) || 0) +
      (Number(data.primary.teachers_summary.untrained_female) || 0);
  }

  if (levels.includes('jhs')) {
    trainedTeachers +=
      (Number(data.jhs.teachers_summary.trained_male) || 0) +
      (Number(data.jhs.teachers_summary.trained_female) || 0);
    untrainedTeachers +=
      (Number(data.jhs.teachers_summary.untrained_male) || 0) +
      (Number(data.jhs.teachers_summary.untrained_female) || 0);
  }

  // Classrooms calculations
  let totalPermanent = 0;
  let totalGood = 0;
  let totalDilapidated = 0;
  let totalUnderTree = 0;

  if (levels.includes('creche')) {
    totalPermanent += Number(data.creche.classrooms.permanent) || 0;
    totalGood += Number(data.creche.classrooms.good_condition) || 0;
    totalDilapidated += Number(data.creche.classrooms.dilapidated) || 0;
    totalUnderTree += Number(data.creche.classrooms.under_tree) || 0;
  }
  if (levels.includes('kg')) {
    totalPermanent += Number(data.kg.classrooms.permanent) || 0;
    totalGood += Number(data.kg.classrooms.good_condition) || 0;
    totalDilapidated += Number(data.kg.classrooms.dilapidated) || 0;
    totalUnderTree += Number(data.kg.classrooms.under_tree) || 0;
  }
  if (levels.includes('primary')) {
    totalPermanent += Number(data.primary.classrooms.permanent) || 0;
    totalGood += Number(data.primary.classrooms.good_condition) || 0;
    totalDilapidated += Number(data.primary.classrooms.dilapidated) || 0;
    totalUnderTree += Number(data.primary.classrooms.under_tree) || 0;
  }
  if (levels.includes('jhs')) {
    totalPermanent += Number(data.jhs.classrooms.permanent) || 0;
    totalGood += Number(data.jhs.classrooms.good_condition) || 0;
    totalDilapidated += Number(data.jhs.classrooms.dilapidated) || 0;
    totalUnderTree += Number(data.jhs.classrooms.under_tree) || 0;
  }

  // Furniture totals
  let totalMono = 0;
  let totalDual = 0;
  let totalOthers = 0;

  if (levels.includes('creche')) {
    totalMono += Number(data.creche.furniture.mono_desk) || 0;
    totalDual += Number(data.creche.furniture.dual_desk) || 0;
    totalOthers += Number(data.creche.furniture.others) || 0;
  }
  if (levels.includes('kg')) {
    totalMono += Number(data.kg.furniture.mono_desk) || 0;
    totalDual += Number(data.kg.furniture.dual_desk) || 0;
    totalOthers += Number(data.kg.furniture.others) || 0;
  }
  if (levels.includes('primary')) {
    totalMono += Number(data.primary.furniture.mono_desk) || 0;
    totalDual += Number(data.primary.furniture.dual_desk) || 0;
    totalOthers += Number(data.primary.furniture.others) || 0;
  }
  if (levels.includes('jhs')) {
    totalMono += Number(data.jhs.furniture.mono_desk) || 0;
    totalDual += Number(data.jhs.furniture.dual_desk) || 0;
    totalOthers += Number(data.jhs.furniture.others) || 0;
  }

  return {
    creche: { boys: crecheBoys, girls: crecheGirls, total: crecheBoys + crecheGirls },
    kg: { boys: kgBoys, girls: kgGirls, total: kgBoys + kgGirls },
    primary: { boys: primaryBoys, girls: primaryGirls, total: primaryBoys + primaryGirls },
    jhs: { boys: jhsBoys, girls: jhsGirls, total: jhsBoys + jhsGirls },
    grandTotalBoys,
    grandTotalGirls,
    grandTotalPupils,
    trainedTeachers,
    untrainedTeachers,
    totalClassrooms: totalPermanent,
    goodClassrooms: totalGood,
    dilapidatedClassrooms: totalDilapidated,
    underTreeClassrooms: totalUnderTree,
    furniture: { mono: totalMono, dual: totalDual, others: totalOthers, total: totalMono + totalDual + totalOthers },
  };
}

// Soft warnings generator (non-blocking guidance)
export function getValidationWarnings(data: FormWizardState): string[] {
  const warnings: string[] = [];
  const totals = calculateTotals(data);
  const levels = data.school_details.chosen_levels || [];

  if (levels.includes('creche') && totals.creche.total === 0) {
    warnings.push('Crèche/Nursery was selected as an active level, but 0 pupils have been recorded.');
  }
  if (levels.includes('kg') && totals.kg.total === 0) {
    warnings.push('KG was selected as an active level, but 0 pupils have been recorded.');
  }
  if (levels.includes('primary') && totals.primary.total === 0) {
    warnings.push('Primary was selected as an active level, but 0 pupils have been recorded.');
  }
  if (levels.includes('jhs') && totals.jhs.total === 0) {
    warnings.push('JHS was selected as an active level, but 0 pupils have been recorded.');
  }

  if (levels.includes('primary')) {
    const p = data.primary.enrolment;
    const classes = [
      { name: 'BS1', total: Number(p.bs1_boys) + Number(p.bs1_girls) },
      { name: 'BS2', total: Number(p.bs2_boys) + Number(p.bs2_girls) },
      { name: 'BS3', total: Number(p.bs3_boys) + Number(p.bs3_girls) },
      { name: 'BS4', total: Number(p.bs4_boys) + Number(p.bs4_girls) },
      { name: 'BS5', total: Number(p.bs5_boys) + Number(p.bs5_girls) },
      { name: 'BS6', total: Number(p.bs6_boys) + Number(p.bs6_girls) },
    ];
    classes.forEach((c) => {
      if (c.total > 60) {
        warnings.push(`Class ${c.name} has a large enrolment (${c.total} pupils). Please confirm this figure.`);
      }
    });
  }

  if (totals.grandTotalPupils > 0 && Number(data.school_details.total_teachers) === 0) {
    warnings.push('Your school has enrolled pupils but total teachers is recorded as 0.');
  }

  return warnings;
}
