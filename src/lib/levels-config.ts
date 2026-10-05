export type LevelId = 'creche' | 'kg' | 'primary' | 'jhs' | 'shs';

export interface LevelConfig {
  id: LevelId;
  label: string;
  shortLabel: string;
  description: string;
  color: string;
  badgeBg: string;
  hasEnrolment: boolean;
  hasTeachers: boolean;
  hasClassrooms: boolean;
  hasFurniture: boolean;
  classes: string[];
}

export const EDUCATION_LEVELS: LevelConfig[] = [
  {
    id: 'creche',
    label: 'Crèche / Nursery',
    shortLabel: 'Crèche',
    description: 'Daycare and nursery level statistics for early childhood',
    color: '#8B5CF6',
    badgeBg: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
    hasEnrolment: true,
    hasTeachers: true,
    hasClassrooms: true,
    hasFurniture: true,
    classes: ['Creche/Nursery'],
  },
  {
    id: 'kg',
    label: 'Kindergarten (KG)',
    shortLabel: 'KG',
    description: 'KG1 and KG2 enrolments, age-groups, teachers, classrooms & furniture',
    color: '#10B981',
    badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
    hasEnrolment: true,
    hasTeachers: true,
    hasClassrooms: true,
    hasFurniture: true,
    classes: ['KG1', 'KG2'],
  },
  {
    id: 'primary',
    label: 'Primary School (BS1 - BS6)',
    shortLabel: 'Primary',
    description: 'Basic 1 to Basic 6 enrolments, teachers per class, age distribution, furniture',
    color: '#F59E0B',
    badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    hasEnrolment: true,
    hasTeachers: true,
    hasClassrooms: true,
    hasFurniture: true,
    classes: ['BS1', 'BS2', 'BS3', 'BS4', 'BS5', 'BS6'],
  },
  {
    id: 'jhs',
    label: 'Junior High School (JHS1 - JHS3)',
    shortLabel: 'JHS',
    description: 'JHS 1 to JHS 3 enrolments, subject teachers, age brackets, facilities',
    color: '#EF4444',
    badgeBg: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
    hasEnrolment: true,
    hasTeachers: true,
    hasClassrooms: true,
    hasFurniture: true,
    classes: ['JHS1', 'JHS2', 'JHS3'],
  },
];

export const LEVEL_MAP = EDUCATION_LEVELS.reduce<Record<LevelId, LevelConfig>>((acc, level) => {
  acc[level.id] = level;
  return acc;
}, {} as Record<LevelId, LevelConfig>);

export const ALL_LEVEL_IDS: LevelId[] = ['creche', 'kg', 'primary', 'jhs'];

export function getLevelName(id: string): string {
  return LEVEL_MAP[id as LevelId]?.label || id.toUpperCase();
}
