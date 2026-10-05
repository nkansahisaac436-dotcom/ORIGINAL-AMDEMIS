export type LevelKey = 'creche' | 'kg' | 'primary' | 'jhs';

export interface LevelDefinition {
  key: LevelKey;
  label: string;
  shortLabel: string;
  stepTitle: string;
  description: string;
  sortOrder: number;
}

export const EDUCATION_LEVELS: Record<LevelKey, LevelDefinition> = {
  creche: {
    key: 'creche',
    label: 'Crèche / Nursery',
    shortLabel: 'Crèche',
    stepTitle: 'Crèche / Nursery Data',
    description: 'Enrolment, classrooms and teachers for Daycare / Nursery',
    sortOrder: 1,
  },
  kg: {
    key: 'kg',
    label: 'Kindergarten (KG)',
    shortLabel: 'KG',
    stepTitle: 'Kindergarten (KG) Data',
    description: 'KG1 and KG2 enrolment by age band and classrooms',
    sortOrder: 2,
  },
  primary: {
    key: 'primary',
    label: 'Primary School (BS1–BS6)',
    shortLabel: 'Primary',
    stepTitle: 'Primary School Data',
    description: 'Basic 1 to Basic 6 enrolments, streams, BS1-BS3 early grade detail',
    sortOrder: 3,
  },
  jhs: {
    key: 'jhs',
    label: 'Junior High School (JHS1–JHS3)',
    shortLabel: 'JHS',
    stepTitle: 'Junior High School Data',
    description: 'JHS1 to JHS3 enrolments, streams and subject teacher allocations',
    sortOrder: 4,
  },
};

export const LEVEL_KEYS: LevelKey[] = ['creche', 'kg', 'primary', 'jhs'];
