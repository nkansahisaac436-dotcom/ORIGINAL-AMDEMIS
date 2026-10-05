import { LevelId } from '@/lib/levels-config';

export type UserRole = 'super_admin' | 'district_officer' | 'headteacher';

export type SchoolStatus = 'public' | 'private';

export type SubmissionStatus = 'draft' | 'submitted' | 'reopened';

export interface Circuit {
  id: string;
  name: string;
  code?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  _school_count?: number;
}

export interface School {
  id: string;
  circuit_id: string;
  name: string;
  status: SchoolStatus;
  school_login_id: string;
  emis_code?: string | null;
  town?: string | null;
  default_levels: LevelId[];
  headteacher_name?: string | null;
  headteacher_phone?: string | null;
  assistant_headteacher_name?: string | null;
  assistant_headteacher_phone?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  circuits?: Circuit;
}

export interface UserProfile {
  id: string;
  role: UserRole;
  school_id?: string | null;
  full_name?: string | null;
  phone?: string | null;
  is_initial_pin: boolean;
  failed_attempts: number;
  locked_until?: string | null;
  created_at: string;
  updated_at: string;
  schools?: School;
}

export interface CollectionRound {
  id: string;
  title: string;
  instructions?: string | null;
  opening_date: string;
  deadline: string;
  is_active: boolean;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
}

export interface Submission {
  id: string;
  school_id: string;
  round_id: string;
  status: SubmissionStatus;
  established_year?: string | null;
  headteacher_name?: string | null;
  headteacher_phone?: string | null;
  assistant_name?: string | null;
  assistant_phone?: string | null;
  total_teachers: number;
  male_teachers: number;
  female_teachers: number;
  town?: string | null;
  submitted_at?: string | null;
  reopened_at?: string | null;
  reopened_by?: string | null;
  reopened_reason?: string | null;
  created_at: string;
  updated_at: string;
  schools?: School;
  rounds?: CollectionRound;
  submission_levels?: { level: LevelId }[];
}

export interface EnrolmentRecord {
  id?: string;
  submission_id?: string;
  level: LevelId;
  class_name: string;
  gender: 'male' | 'female';
  age_band: string; // 'all', 'age_4', 'age_5', 'age_4_5', 'age_6', 'age_6_11', 'age_12', 'age_12_14'
  count: number;
}

export interface TeacherRecord {
  id?: string;
  submission_id?: string;
  level: LevelId;
  class_name: string; // 'all', 'KG1', 'BS1', etc.
  gender: 'male' | 'female';
  is_trained: boolean;
  count: number;
}

export interface ClassroomRecord {
  id?: string;
  submission_id?: string;
  level: LevelId;
  permanent: number;
  good_condition: number;
  dilapidated: number;
  under_tree: number;
}

export interface FurnitureRecord {
  id?: string;
  submission_id?: string;
  level: LevelId;
  furniture_type: 'mono_desk' | 'dual_desk' | 'others';
  count: number;
}

export interface StaffPayrollRecord {
  id?: string;
  submission_id?: string;
  level_group: 'kg_primary' | 'jhs';
  male_count: number;
  female_count: number;
}

export interface SpecialTeacherRecord {
  id?: string;
  submission_id?: string;
  subject: 'french' | 'arabic';
  has_teacher: boolean;
}

export interface InfrastructureRecord {
  id?: string;
  submission_id?: string;
  ict_lab: '1' | 'N/A';
  staff_common_room: boolean;
  library: '1' | 'N/A';
  electricity: boolean;
  potable_water: boolean;
  toilet_facility: boolean;
  urinal_facility: boolean;
}

export interface NotificationItem {
  id: string;
  school_id?: string | null;
  title: string;
  message: string;
  type: 'deadline' | 'reopened' | 'info' | 'reminder';
  is_read: boolean;
  created_at: string;
}

export interface AuditLogItem {
  id: string;
  user_id?: string | null;
  action: string;
  target_type: string;
  target_id?: string | null;
  details?: Record<string, unknown> | null;
  created_at: string;
  profiles?: { full_name?: string | null; role?: string };
}

// Form state data interface representing the complete wizard state
export interface FormWizardState {
  school_details: {
    chosen_levels: LevelId[];
    emis_code: string;
    established_year: string;
    headteacher_name: string;
    headteacher_phone: string;
    assistant_name: string;
    assistant_phone: string;
    total_teachers: number | string;
    male_teachers: number | string;
    female_teachers: number | string;
    town: string;
  };
  creche: {
    boys: number | string;
    girls: number | string;
    male_teachers: number | string;
    female_teachers: number | string;
    classrooms: {
      permanent: number | string;
      good_condition: number | string;
      dilapidated: number | string;
      under_tree: number | string;
    };
    furniture: {
      mono_desk: number | string;
      dual_desk: number | string;
      others: number | string;
    };
  };
  kg: {
    enrolment: {
      kg1_boys: number | string;
      kg1_girls: number | string;
      kg2_boys: number | string;
      kg2_girls: number | string;
      kg1_boys_age4: number | string;
      kg1_girls_age4: number | string;
      kg2_boys_age5: number | string;
      kg2_girls_age5: number | string;
      kg_boys_age4_5: number | string;
      kg_girls_age4_5: number | string;
    };
    teachers: {
      kg1_teachers: number | string;
      kg2_teachers: number | string;
      trained_male: number | string;
      trained_female: number | string;
      untrained_male: number | string;
      untrained_female: number | string;
    };
    classrooms: {
      permanent: number | string;
      good_condition: number | string;
      dilapidated: number | string;
      under_tree: number | string;
    };
    furniture: {
      mono_desk: number | string;
      dual_desk: number | string;
      others: number | string;
    };
  };
  primary: {
    enrolment: {
      bs1_boys: number | string;
      bs1_girls: number | string;
      bs2_boys: number | string;
      bs2_girls: number | string;
      bs3_boys: number | string;
      bs3_girls: number | string;
      bs4_boys: number | string;
      bs4_girls: number | string;
      bs5_boys: number | string;
      bs5_girls: number | string;
      bs6_boys: number | string;
      bs6_girls: number | string;
      bs1_boys_age6: number | string;
      bs1_girls_age6: number | string;
      bs_boys_age6_11: number | string;
      bs_girls_age6_11: number | string;
    };
    teachers_per_class: {
      bs1: number | string;
      bs2: number | string;
      bs3: number | string;
      bs4: number | string;
      bs5: number | string;
      bs6: number | string;
    };
    teachers_summary: {
      trained_male: number | string;
      trained_female: number | string;
      untrained_male: number | string;
      untrained_female: number | string;
    };
    bs_detail: {
      bs1: { trained_m: number | string; trained_f: number | string; untrained_m: number | string; untrained_f: number | string };
      bs2: { trained_m: number | string; trained_f: number | string; untrained_m: number | string; untrained_f: number | string };
      bs3: { trained_m: number | string; trained_f: number | string; untrained_m: number | string; untrained_f: number | string };
    };
    classrooms: {
      permanent: number | string;
      good_condition: number | string;
      dilapidated: number | string;
      under_tree: number | string;
    };
    furniture: {
      mono_desk: number | string;
      dual_desk: number | string;
      others: number | string;
    };
    payroll: {
      male: number | string;
      female: number | string;
    };
  };
  jhs: {
    enrolment: {
      jhs1_boys: number | string;
      jhs1_girls: number | string;
      jhs2_boys: number | string;
      jhs2_girls: number | string;
      jhs3_boys: number | string;
      jhs3_girls: number | string;
      jhs1_boys_age12: number | string;
      jhs1_girls_age12: number | string;
      jhs_boys_age12_14: number | string;
      jhs_girls_age12_14: number | string;
    };
    total_jhs_teachers: number | string;
    special_teachers: {
      has_french: boolean;
      has_arabic: boolean;
    };
    teachers_summary: {
      trained_male: number | string;
      trained_female: number | string;
      untrained_male: number | string;
      untrained_female: number | string;
    };
    classrooms: {
      permanent: number | string;
      good_condition: number | string;
      dilapidated: number | string;
      under_tree: number | string;
    };
    furniture: {
      mono_desk: number | string;
      dual_desk: number | string;
      others: number | string;
    };
    payroll: {
      male: number | string;
      female: number | string;
    };
  };
  infrastructure: {
    ict_lab: '1' | 'N/A';
    staff_common_room: boolean;
    library: '1' | 'N/A';
    electricity: boolean;
    potable_water: boolean;
    toilet_facility: boolean;
    urinal_facility: boolean;
  };
  confirmed: boolean;
}
