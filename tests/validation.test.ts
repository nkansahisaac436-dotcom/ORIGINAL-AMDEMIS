import { describe, it, expect } from 'vitest';
import {
  schoolDetailsSchema,
  kgSectionSchema,
  primarySectionSchema,
  jhsSectionSchema,
  crecheSectionSchema,
  calculateTotals,
  getValidationWarnings,
} from '../src/lib/schemas/submission';
import { FormWizardState } from '../src/types';
import { getInitialFormData } from '../src/lib/form-default-state';

describe('AMDEMIS Form Validation & Calculation Rules', () => {
  describe('Step 1: School Details & Teacher Sums', () => {
    it('should validate when male + female teachers equals total teachers', () => {
      const validData = {
        chosen_levels: ['primary' as const],
        emis_code: '1066320014',
        established_year: '2005',
        headteacher_name: 'Kwame Mensah',
        headteacher_phone: '0244123456',
        assistant_name: '',
        assistant_phone: '',
        total_teachers: 15,
        male_teachers: 8,
        female_teachers: 7,
        town: '',
        is_private: false,
      };

      const result = schoolDetailsSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should fail validation when male + female teachers does not equal total teachers', () => {
      const invalidData = {
        chosen_levels: ['primary' as const],
        emis_code: '1066320014',
        established_year: '2005',
        headteacher_name: 'Kwame Mensah',
        headteacher_phone: '0244123456',
        total_teachers: 15,
        male_teachers: 5,
        female_teachers: 5, // Sum = 10 != 15
        town: '',
        is_private: false,
      };

      const result = schoolDetailsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toContain('Total teachers must equal Male teachers + Female teachers');
      }
    });

    it('should require town/location for private schools', () => {
      const privateWithoutTown = {
        chosen_levels: ['primary' as const],
        emis_code: '1066320014',
        established_year: '2005',
        headteacher_name: 'Kwame Mensah',
        headteacher_phone: '0244123456',
        total_teachers: 10,
        male_teachers: 5,
        female_teachers: 5,
        town: '',
        is_private: true,
      };

      const result = schoolDetailsSchema.safeParse(privateWithoutTown);
      expect(result.success).toBe(false);
    });
  });

  describe('Kindergarten (KG) Consistency Rules', () => {
    it('should fail when age-band count exceeds class gender total', () => {
      const invalidAgeData = {
        enrolment: {
          kg1_boys: 20,
          kg1_girls: 20,
          kg2_boys: 15,
          kg2_girls: 15,
          kg1_boys_age4: 25, // 25 > 20 (invalid!)
          kg1_girls_age4: 18,
          kg2_boys_age5: 12,
          kg2_girls_age5: 14,
          kg_boys_age4_5: 30,
          kg_girls_age4_5: 30,
        },
        teachers: {
          kg1_teachers: 1,
          kg2_teachers: 1,
          trained_male: 1,
          trained_female: 1,
          untrained_male: 0,
          untrained_female: 0,
        },
        classrooms: {
          permanent: 2,
          good_condition: 2,
          dilapidated: 0,
          under_tree: 0,
        },
        furniture: {
          mono_desk: 0,
          dual_desk: 20,
          others: 10,
        },
      };

      const result = kgSectionSchema.safeParse(invalidAgeData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toContain('KG1 Boys aged 4 cannot exceed total KG1 Boys');
      }
    });

    it('should validate teacher totals match trained + untrained breakdown', () => {
      const invalidTeachers = {
        enrolment: {
          kg1_boys: 20,
          kg1_girls: 20,
          kg2_boys: 15,
          kg2_girls: 15,
          kg1_boys_age4: 15,
          kg1_girls_age4: 15,
          kg2_boys_age5: 10,
          kg2_girls_age5: 10,
          kg_boys_age4_5: 25,
          kg_girls_age4_5: 25,
        },
        teachers: {
          kg1_teachers: 2,
          kg2_teachers: 2, // Total class teachers = 4
          trained_male: 1,
          trained_female: 1,
          untrained_male: 0,
          untrained_female: 0, // Breakdown sum = 2 != 4
        },
        classrooms: {
          permanent: 2,
          good_condition: 2,
          dilapidated: 0,
          under_tree: 0,
        },
        furniture: {
          mono_desk: 0,
          dual_desk: 20,
          others: 10,
        },
      };

      const result = kgSectionSchema.safeParse(invalidTeachers);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toContain('Total KG class teachers');
      }
    });
  });

  describe('Primary School Consistency Rules', () => {
    it('should validate BS1-BS3 detail consistency with assigned class teachers', () => {
      const validPrimary = {
        enrolment: {
          bs1_boys: 15,
          bs1_girls: 15,
          bs2_boys: 15,
          bs2_girls: 15,
          bs3_boys: 15,
          bs3_girls: 15,
          bs4_boys: 15,
          bs4_girls: 15,
          bs5_boys: 15,
          bs5_girls: 15,
          bs6_boys: 15,
          bs6_girls: 15,
          bs1_boys_age6: 12,
          bs1_girls_age6: 12,
          bs_boys_age6_11: 80,
          bs_girls_age6_11: 80,
        },
        teachers_per_class: {
          bs1: 1,
          bs2: 1,
          bs3: 1,
          bs4: 1,
          bs5: 1,
          bs6: 1,
        },
        teachers_summary: {
          trained_male: 3,
          trained_female: 3,
          untrained_male: 0,
          untrained_female: 0,
        },
        bs_detail: {
          bs1: { trained_m: 1, trained_f: 0, untrained_m: 0, untrained_f: 0 },
          bs2: { trained_m: 0, trained_f: 1, untrained_m: 0, untrained_f: 0 },
          bs3: { trained_m: 1, trained_f: 0, untrained_m: 0, untrained_f: 0 },
        },
        classrooms: {
          permanent: 6,
          good_condition: 5,
          dilapidated: 1,
          under_tree: 0,
        },
        furniture: {
          mono_desk: 30,
          dual_desk: 50,
          others: 0,
        },
        payroll: {
          male: 1,
          female: 1,
        },
      };

      const result = primarySectionSchema.safeParse(validPrimary);
      expect(result.success).toBe(true);
    });
  });

  describe('Auto-Calculation Engine', () => {
    it('should correctly sum grand total enrolment across selected levels', () => {
      const state = getInitialFormData();
      state.school_details.chosen_levels = ['kg', 'primary'];

      state.kg.enrolment.kg1_boys = 10;
      state.kg.enrolment.kg1_girls = 12;
      state.kg.enrolment.kg2_boys = 8;
      state.kg.enrolment.kg2_girls = 10;

      state.primary.enrolment.bs1_boys = 15;
      state.primary.enrolment.bs1_girls = 15;

      const totals = calculateTotals(state);
      expect(totals.kg.boys).toBe(18);
      expect(totals.kg.girls).toBe(22);
      expect(totals.kg.total).toBe(40);

      expect(totals.primary.boys).toBe(15);
      expect(totals.primary.girls).toBe(15);
      expect(totals.primary.total).toBe(30);

      expect(totals.grandTotalBoys).toBe(33);
      expect(totals.grandTotalGirls).toBe(37);
      expect(totals.grandTotalPupils).toBe(70);
    });

    it('should trigger quality warnings when class size is large or zero pupils in chosen level', () => {
      const state = getInitialFormData();
      state.school_details.chosen_levels = ['primary'];
      state.primary.enrolment.bs1_boys = 45;
      state.primary.enrolment.bs1_girls = 30; // 75 pupils > 60

      const warnings = getValidationWarnings(state);
      expect(warnings.some((w) => w.includes('BS1 has a large enrolment (75 pupils)'))).toBe(true);
    });
  });
});
