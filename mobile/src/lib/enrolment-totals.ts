/**
 * AMDEMIS Shared Enrolment Totals Helper Module (Mobile)
 * Computes live, read-only enrolment totals across classes, levels, and school-wide figures.
 */

export interface ClassTotal {
  boys: number;
  girls: number;
  total: number;
}

export interface LevelTotals {
  boys: number;
  girls: number;
  total: number;
}

export interface KGSectionTotals extends LevelTotals {
  kg1: ClassTotal;
  kg2: ClassTotal;
}

export interface PrimarySectionTotals extends LevelTotals {
  bs1: ClassTotal;
  bs2: ClassTotal;
  bs3: ClassTotal;
  bs4: ClassTotal;
  bs5: ClassTotal;
  bs6: ClassTotal;
}

export interface JHSSectionTotals extends LevelTotals {
  jhs1: ClassTotal;
  jhs2: ClassTotal;
  jhs3: ClassTotal;
}

export interface SchoolEnrolmentSummary {
  creche: LevelTotals;
  kg: KGSectionTotals;
  primary: PrimarySectionTotals;
  jhs: JHSSectionTotals;
  grandTotalBoys: number;
  grandTotalGirls: number;
  grandTotalPupils: number;
}

export function safeNumber(val: unknown): number {
  if (val === null || val === undefined || val === '') return 0;
  const parsed = Number(val);
  if (Number.isNaN(parsed) || !Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.round(parsed));
}

export function getClassTotal(boys: unknown, girls: unknown): number {
  return safeNumber(boys) + safeNumber(girls);
}

export function getCrecheTotals(crecheData: { boys?: unknown; girls?: unknown } | null | undefined): LevelTotals {
  const boys = safeNumber(crecheData?.boys);
  const girls = safeNumber(crecheData?.girls);
  return {
    boys,
    girls,
    total: boys + girls,
  };
}

export function getKGTotals(kgEnrolment: {
  kg1_boys?: unknown;
  kg1_girls?: unknown;
  kg2_boys?: unknown;
  kg2_girls?: unknown;
} | null | undefined): KGSectionTotals {
  const kg1Boys = safeNumber(kgEnrolment?.kg1_boys);
  const kg1Girls = safeNumber(kgEnrolment?.kg1_girls);
  const kg2Boys = safeNumber(kgEnrolment?.kg2_boys);
  const kg2Girls = safeNumber(kgEnrolment?.kg2_girls);

  const kg1: ClassTotal = {
    boys: kg1Boys,
    girls: kg1Girls,
    total: kg1Boys + kg1Girls,
  };

  const kg2: ClassTotal = {
    boys: kg2Boys,
    girls: kg2Girls,
    total: kg2Boys + kg2Girls,
  };

  const totalBoys = kg1.boys + kg2.boys;
  const totalGirls = kg1.girls + kg2.girls;

  return {
    kg1,
    kg2,
    boys: totalBoys,
    girls: totalGirls,
    total: totalBoys + totalGirls,
  };
}

export function getPrimaryTotals(primaryEnrolment: Record<string, unknown> | null | undefined): PrimarySectionTotals {
  const bsClasses = ['bs1', 'bs2', 'bs3', 'bs4', 'bs5', 'bs6'] as const;
  const classTotals = {} as Record<'bs1' | 'bs2' | 'bs3' | 'bs4' | 'bs5' | 'bs6', ClassTotal>;

  let totalBoys = 0;
  let totalGirls = 0;

  for (const cls of bsClasses) {
    const boys = safeNumber(primaryEnrolment?.[`${cls}_boys`]);
    const girls = safeNumber(primaryEnrolment?.[`${cls}_girls`]);
    const total = boys + girls;
    classTotals[cls] = { boys, girls, total };
    totalBoys += boys;
    totalGirls += girls;
  }

  return {
    bs1: classTotals.bs1,
    bs2: classTotals.bs2,
    bs3: classTotals.bs3,
    bs4: classTotals.bs4,
    bs5: classTotals.bs5,
    bs6: classTotals.bs6,
    boys: totalBoys,
    girls: totalGirls,
    total: totalBoys + totalGirls,
  };
}

export function getJHSTotals(jhsEnrolment: Record<string, unknown> | null | undefined): JHSSectionTotals {
  const jhsClasses = ['jhs1', 'jhs2', 'jhs3'] as const;
  const classTotals = {} as Record<'jhs1' | 'jhs2' | 'jhs3', ClassTotal>;

  let totalBoys = 0;
  let totalGirls = 0;

  for (const cls of jhsClasses) {
    const boys = safeNumber(jhsEnrolment?.[`${cls}_boys`]);
    const girls = safeNumber(jhsEnrolment?.[`${cls}_girls`]);
    const total = boys + girls;
    classTotals[cls] = { boys, girls, total };
    totalBoys += boys;
    totalGirls += girls;
  }

  return {
    jhs1: classTotals.jhs1,
    jhs2: classTotals.jhs2,
    jhs3: classTotals.jhs3,
    boys: totalBoys,
    girls: totalGirls,
    total: totalBoys + totalGirls,
  };
}

export function getLevelTotals(
  formData: any,
  level: 'creche' | 'kg' | 'primary' | 'jhs'
): LevelTotals {
  if (!formData) return { boys: 0, girls: 0, total: 0 };

  switch (level) {
    case 'creche':
      return getCrecheTotals(formData.creche);
    case 'kg':
      return getKGTotals(formData.kg?.enrolment);
    case 'primary':
      return getPrimaryTotals(formData.primary?.enrolment);
    case 'jhs':
      return getJHSTotals(formData.jhs?.enrolment);
    default:
      return { boys: 0, girls: 0, total: 0 };
  }
}

export function getSchoolTotals(formData: any): SchoolEnrolmentSummary {
  const creche = getCrecheTotals(formData?.creche);
  const kg = getKGTotals(formData?.kg?.enrolment);
  const primary = getPrimaryTotals(formData?.primary?.enrolment);
  const jhs = getJHSTotals(formData?.jhs?.enrolment);

  const chosenLevels: string[] =
    formData?.school_details?.chosen_levels ||
    formData?.chosenLevels ||
    ['creche', 'kg', 'primary', 'jhs'];

  let grandTotalBoys = 0;
  let grandTotalGirls = 0;

  if (chosenLevels.includes('creche')) {
    grandTotalBoys += creche.boys;
    grandTotalGirls += creche.girls;
  }
  if (chosenLevels.includes('kg')) {
    grandTotalBoys += kg.boys;
    grandTotalGirls += kg.girls;
  }
  if (chosenLevels.includes('primary')) {
    grandTotalBoys += primary.boys;
    grandTotalGirls += primary.girls;
  }
  if (chosenLevels.includes('jhs')) {
    grandTotalBoys += jhs.boys;
    grandTotalGirls += jhs.girls;
  }

  return {
    creche,
    kg,
    primary,
    jhs,
    grandTotalBoys,
    grandTotalGirls,
    grandTotalPupils: grandTotalBoys + grandTotalGirls,
  };
}
