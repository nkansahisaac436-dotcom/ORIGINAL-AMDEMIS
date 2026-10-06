import { describe, it, expect } from 'vitest';
import {
  safeNumber,
  getClassTotal,
  getCrecheTotals,
  getKGTotals,
  getPrimaryTotals,
  getJHSTotals,
  getLevelTotals,
  getSchoolTotals,
} from '../src/lib/enrolment-totals';

describe('Enrolment Totals Engine & Helpers', () => {
  describe('safeNumber helper', () => {
    it('handles blanks, null, undefined, and non-numeric inputs', () => {
      expect(safeNumber('')).toBe(0);
      expect(safeNumber(null)).toBe(0);
      expect(safeNumber(undefined)).toBe(0);
      expect(safeNumber('abc')).toBe(0);
      expect(safeNumber(NaN)).toBe(0);
      expect(safeNumber(Infinity)).toBe(0);
    });

    it('handles zeros and negative numbers', () => {
      expect(safeNumber(0)).toBe(0);
      expect(safeNumber('0')).toBe(0);
      expect(safeNumber(-5)).toBe(0);
      expect(safeNumber('-10')).toBe(0);
    });

    it('handles valid numbers and numeric strings with rounding', () => {
      expect(safeNumber(42)).toBe(42);
      expect(safeNumber('128')).toBe(128);
      expect(safeNumber(15.7)).toBe(16);
      expect(safeNumber('24.2')).toBe(24);
      expect(safeNumber(1000000)).toBe(1000000);
    });
  });

  describe('getClassTotal helper', () => {
    it('computes class total = boys + girls live', () => {
      expect(getClassTotal(10, 15)).toBe(25);
      expect(getClassTotal('20', '30')).toBe(50);
      expect(getClassTotal(0, 0)).toBe(0);
    });

    it('treats blank and invalid entries as 0', () => {
      expect(getClassTotal('', 15)).toBe(15);
      expect(getClassTotal(25, '')).toBe(25);
      expect(getClassTotal('', '')).toBe(0);
      expect(getClassTotal(null, undefined)).toBe(0);
    });

    it('handles large numbers accurately', () => {
      expect(getClassTotal(54321, 65432)).toBe(119753);
      expect(getClassTotal('50000', '50000')).toBe(100000);
    });
  });

  describe('getCrecheTotals', () => {
    it('computes creche totals when data is provided', () => {
      const res = getCrecheTotals({ boys: 12, girls: 18 });
      expect(res.boys).toBe(12);
      expect(res.girls).toBe(18);
      expect(res.total).toBe(30);
    });

    it('handles null/undefined creche data', () => {
      const res = getCrecheTotals(null);
      expect(res.boys).toBe(0);
      expect(res.girls).toBe(0);
      expect(res.total).toBe(0);
    });
  });

  describe('getKGTotals', () => {
    it('computes KG1, KG2, and KG overall totals correctly', () => {
      const kgData = {
        kg1_boys: 25,
        kg1_girls: 30,
        kg2_boys: 20,
        kg2_girls: 22,
      };
      const res = getKGTotals(kgData);
      expect(res.kg1.boys).toBe(25);
      expect(res.kg1.girls).toBe(30);
      expect(res.kg1.total).toBe(55);

      expect(res.kg2.boys).toBe(20);
      expect(res.kg2.girls).toBe(22);
      expect(res.kg2.total).toBe(42);

      expect(res.boys).toBe(45);
      expect(res.girls).toBe(52);
      expect(res.total).toBe(97);
    });

    it('handles empty / partial KG data', () => {
      const res = getKGTotals({ kg1_boys: '10' });
      expect(res.kg1.boys).toBe(10);
      expect(res.kg1.girls).toBe(0);
      expect(res.kg1.total).toBe(10);
      expect(res.kg2.total).toBe(0);
      expect(res.total).toBe(10);
    });
  });

  describe('getPrimaryTotals', () => {
    it('computes BS1 through BS6 totals and primary section totals', () => {
      const primaryData = {
        bs1_boys: 10, bs1_girls: 12,
        bs2_boys: 15, bs2_girls: 15,
        bs3_boys: 14, bs3_girls: 16,
        bs4_boys: 20, bs4_girls: 18,
        bs5_boys: 22, bs5_girls: 25,
        bs6_boys: 18, bs6_girls: 20,
      };
      const res = getPrimaryTotals(primaryData);
      expect(res.bs1.total).toBe(22);
      expect(res.bs2.total).toBe(30);
      expect(res.bs3.total).toBe(30);
      expect(res.bs4.total).toBe(38);
      expect(res.bs5.total).toBe(47);
      expect(res.bs6.total).toBe(38);

      expect(res.boys).toBe(99);
      expect(res.girls).toBe(106);
      expect(res.total).toBe(205);
    });

    it('handles blank primary enrolment object', () => {
      const res = getPrimaryTotals(null);
      expect(res.bs1.total).toBe(0);
      expect(res.bs6.total).toBe(0);
      expect(res.total).toBe(0);
    });
  });

  describe('getJHSTotals', () => {
    it('computes JHS1 through JHS3 totals and JHS section totals', () => {
      const jhsData = {
        jhs1_boys: 30, jhs1_girls: 35,
        jhs2_boys: 28, jhs2_girls: 32,
        jhs3_boys: 25, jhs3_girls: 30,
      };
      const res = getJHSTotals(jhsData);
      expect(res.jhs1.total).toBe(65);
      expect(res.jhs2.total).toBe(60);
      expect(res.jhs3.total).toBe(55);

      expect(res.boys).toBe(83);
      expect(res.girls).toBe(97);
      expect(res.total).toBe(180);
    });
  });

  describe('getLevelTotals dispatcher', () => {
    it('dispatches to correct level calculator', () => {
      const formData = {
        creche: { boys: 5, girls: 5 },
        kg: { enrolment: { kg1_boys: 10, kg1_girls: 10 } },
        primary: { enrolment: { bs1_boys: 20, bs1_girls: 20 } },
        jhs: { enrolment: { jhs1_boys: 30, jhs1_girls: 30 } },
      };

      expect(getLevelTotals(formData, 'creche').total).toBe(10);
      expect(getLevelTotals(formData, 'kg').total).toBe(20);
      expect(getLevelTotals(formData, 'primary').total).toBe(40);
      expect(getLevelTotals(formData, 'jhs').total).toBe(60);
    });
  });

  describe('getSchoolTotals - Multi-Level School Scenarios', () => {
    it('calculates full school totals across all four levels', () => {
      const formData = {
        school_details: {
          chosen_levels: ['creche', 'kg', 'primary', 'jhs'],
        },
        creche: { boys: 10, girls: 15 },
        kg: { enrolment: { kg1_boys: 10, kg1_girls: 10, kg2_boys: 10, kg2_girls: 10 } },
        primary: {
          enrolment: {
            bs1_boys: 10, bs1_girls: 10,
            bs2_boys: 10, bs2_girls: 10,
            bs3_boys: 10, bs3_girls: 10,
            bs4_boys: 10, bs4_girls: 10,
            bs5_boys: 10, bs5_girls: 10,
            bs6_boys: 10, bs6_girls: 10,
          },
        },
        jhs: {
          enrolment: {
            jhs1_boys: 10, jhs1_girls: 10,
            jhs2_boys: 10, jhs2_girls: 10,
            jhs3_boys: 10, jhs3_girls: 10,
          },
        },
      };

      const summary = getSchoolTotals(formData);
      expect(summary.creche.total).toBe(25);
      expect(summary.kg.total).toBe(40);
      expect(summary.primary.total).toBe(120);
      expect(summary.jhs.total).toBe(60);

      // Grand totals: 10+20+60+30 boys = 120 boys; 15+20+60+30 girls = 125 girls. Total = 245
      expect(summary.grandTotalBoys).toBe(120);
      expect(summary.grandTotalGirls).toBe(125);
      expect(summary.grandTotalPupils).toBe(245);
    });

    it('calculates totals for a school offering ONLY Primary (filters out other levels from grand total)', () => {
      const formData = {
        school_details: {
          chosen_levels: ['primary'],
        },
        creche: { boys: 50, girls: 50 }, // Not in chosen_levels
        kg: { enrolment: { kg1_boys: 40, kg1_girls: 40 } }, // Not in chosen_levels
        primary: {
          enrolment: {
            bs1_boys: 20, bs1_girls: 25,
            bs2_boys: 18, bs2_girls: 22,
            bs3_boys: 0, bs3_girls: 0,
            bs4_boys: 0, bs4_girls: 0,
            bs5_boys: 0, bs5_girls: 0,
            bs6_boys: 0, bs6_girls: 0,
          },
        },
      };

      const summary = getSchoolTotals(formData);
      expect(summary.grandTotalBoys).toBe(38);
      expect(summary.grandTotalGirls).toBe(47);
      expect(summary.grandTotalPupils).toBe(85);
    });

    it('calculates totals for a school offering only KG and JHS with zero/empty values', () => {
      const formData = {
        school_details: {
          chosen_levels: ['kg', 'jhs'],
        },
        kg: { enrolment: { kg1_boys: '', kg1_girls: 0, kg2_boys: '15', kg2_girls: null } },
        jhs: { enrolment: { jhs1_boys: 10, jhs1_girls: '20' } },
      };

      const summary = getSchoolTotals(formData);
      expect(summary.kg.kg1.total).toBe(0);
      expect(summary.kg.kg2.total).toBe(15);
      expect(summary.kg.total).toBe(15);
      expect(summary.jhs.jhs1.total).toBe(30);
      expect(summary.jhs.total).toBe(30);
      expect(summary.grandTotalBoys).toBe(25);
      expect(summary.grandTotalGirls).toBe(20);
      expect(summary.grandTotalPupils).toBe(45);
    });
  });
});
