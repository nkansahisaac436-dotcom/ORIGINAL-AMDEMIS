-- AMDEMIS Complete Database Setup & Schema
-- Run this entire script in Supabase Dashboard -> SQL Editor -> Run

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================================================
-- 1. TABLES & SEQUENCES
-- ========================================================================

-- Circuits Table
CREATE TABLE IF NOT EXISTS public.circuits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    code TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Schools Table
CREATE TABLE IF NOT EXISTS public.schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    circuit_id UUID NOT NULL REFERENCES public.circuits(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('public', 'private')),
    school_login_id TEXT NOT NULL UNIQUE, -- e.g. AMD-0001, AMD-0002
    emis_code TEXT,
    town TEXT,
    default_levels TEXT[] NOT NULL DEFAULT ARRAY['primary'],
    headteacher_name TEXT,
    headteacher_phone TEXT,
    assistant_headteacher_name TEXT,
    assistant_headteacher_phone TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Profiles Table (Linked with Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'district_officer', 'headteacher')),
    school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
    full_name TEXT,
    phone TEXT,
    is_initial_pin BOOLEAN NOT NULL DEFAULT true,
    failed_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Collection Rounds Table
CREATE TABLE IF NOT EXISTS public.rounds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL, -- e.g. "2025/2026 Academic Year"
    instructions TEXT,
    opening_date DATE NOT NULL DEFAULT CURRENT_DATE,
    deadline TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT false,
    is_locked BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Submissions Table
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE RESTRICT,
    round_id UUID NOT NULL REFERENCES public.rounds(id) ON DELETE RESTRICT,
    status TEXT NOT NULL CHECK (status IN ('draft', 'submitted', 'reopened')) DEFAULT 'draft',
    established_year TEXT,
    headteacher_name TEXT,
    headteacher_phone TEXT,
    assistant_name TEXT,
    assistant_phone TEXT,
    total_teachers INTEGER NOT NULL DEFAULT 0,
    male_teachers INTEGER NOT NULL DEFAULT 0,
    female_teachers INTEGER NOT NULL DEFAULT 0,
    town TEXT,
    submitted_at TIMESTAMPTZ,
    reopened_at TIMESTAMPTZ,
    reopened_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reopened_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_school_round UNIQUE (school_id, round_id)
);

-- Submission Chosen Levels Table
CREATE TABLE IF NOT EXISTS public.submission_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
    level TEXT NOT NULL CHECK (level IN ('creche', 'kg', 'primary', 'jhs', 'shs')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_submission_level UNIQUE (submission_id, level)
);

-- Normalized Enrolment Table
CREATE TABLE IF NOT EXISTS public.enrolment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
    level TEXT NOT NULL CHECK (level IN ('creche', 'kg', 'primary', 'jhs', 'shs')),
    class_name TEXT NOT NULL,
    gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
    age_band TEXT NOT NULL DEFAULT 'all',
    count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_enrolment_record UNIQUE (submission_id, level, class_name, gender, age_band)
);

-- Normalized Teachers Table
CREATE TABLE IF NOT EXISTS public.teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
    level TEXT NOT NULL CHECK (level IN ('creche', 'kg', 'primary', 'jhs', 'shs')),
    class_name TEXT NOT NULL DEFAULT 'all',
    gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
    is_trained BOOLEAN NOT NULL DEFAULT true,
    count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_teachers_record UNIQUE (submission_id, level, class_name, gender, is_trained)
);

-- Normalized Classrooms Table
CREATE TABLE IF NOT EXISTS public.classrooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
    level TEXT NOT NULL CHECK (level IN ('creche', 'kg', 'primary', 'jhs', 'shs')),
    permanent INTEGER NOT NULL DEFAULT 0 CHECK (permanent >= 0),
    good_condition INTEGER NOT NULL DEFAULT 0 CHECK (good_condition >= 0),
    dilapidated INTEGER NOT NULL DEFAULT 0 CHECK (dilapidated >= 0),
    under_tree INTEGER NOT NULL DEFAULT 0 CHECK (under_tree >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_classrooms_level UNIQUE (submission_id, level)
);

-- Normalized Furniture Table
CREATE TABLE IF NOT EXISTS public.furniture (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
    level TEXT NOT NULL CHECK (level IN ('creche', 'kg', 'primary', 'jhs', 'shs')),
    furniture_type TEXT NOT NULL CHECK (furniture_type IN ('mono_desk', 'dual_desk', 'others')),
    count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_furniture_record UNIQUE (submission_id, level, furniture_type)
);

-- Staff Payroll Table
CREATE TABLE IF NOT EXISTS public.staff_payroll (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
    level_group TEXT NOT NULL CHECK (level_group IN ('kg_primary', 'jhs')),
    male_count INTEGER NOT NULL DEFAULT 0 CHECK (male_count >= 0),
    female_count INTEGER NOT NULL DEFAULT 0 CHECK (female_count >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_staff_payroll UNIQUE (submission_id, level_group)
);

-- Special Teachers Table
CREATE TABLE IF NOT EXISTS public.special_teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
    subject TEXT NOT NULL CHECK (subject IN ('french', 'arabic')),
    has_teacher BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_special_teacher UNIQUE (submission_id, subject)
);

-- Infrastructure Table
CREATE TABLE IF NOT EXISTS public.infrastructure (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
    ict_lab TEXT NOT NULL CHECK (ict_lab IN ('1', 'N/A')) DEFAULT 'N/A',
    staff_common_room BOOLEAN NOT NULL DEFAULT false,
    library TEXT NOT NULL CHECK (library IN ('1', 'N/A')) DEFAULT 'N/A',
    electricity BOOLEAN NOT NULL DEFAULT false,
    potable_water BOOLEAN NOT NULL DEFAULT false,
    toilet_facility BOOLEAN NOT NULL DEFAULT false,
    urinal_facility BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_infrastructure UNIQUE (submission_id)
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('deadline', 'reopened', 'info', 'reminder')),
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Audit Log Table
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id UUID,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Auto sequence for School Login ID format (AMD-0001, AMD-0002)
CREATE SEQUENCE IF NOT EXISTS public.school_login_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_school_login_id()
RETURNS TRIGGER AS $$
DECLARE
    next_val INTEGER;
BEGIN
    IF NEW.school_login_id IS NULL OR NEW.school_login_id = '' THEN
        next_val := nextval('public.school_login_seq');
        NEW.school_login_id := 'AMD-' || LPAD(next_val::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_school_login_id ON public.schools;
CREATE TRIGGER trigger_school_login_id
    BEFORE INSERT ON public.schools
    FOR EACH ROW
    EXECUTE FUNCTION public.generate_school_login_id();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_schools_circuit ON public.schools(circuit_id);
CREATE INDEX IF NOT EXISTS idx_schools_login_id ON public.schools(school_login_id);
CREATE INDEX IF NOT EXISTS idx_submissions_school ON public.submissions(school_id);
CREATE INDEX IF NOT EXISTS idx_submissions_round ON public.submissions(round_id);
CREATE INDEX IF NOT EXISTS idx_enrolment_submission ON public.enrolment(submission_id);
CREATE INDEX IF NOT EXISTS idx_teachers_submission ON public.teachers(submission_id);
CREATE INDEX IF NOT EXISTS idx_classrooms_submission ON public.classrooms(submission_id);
CREATE INDEX IF NOT EXISTS idx_furniture_submission ON public.furniture(submission_id);
CREATE INDEX IF NOT EXISTS idx_notifications_school ON public.notifications(school_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_log(created_at DESC);

-- ========================================================================
-- 2. ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================================

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_school_id()
RETURNS UUID AS $$
    SELECT school_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT role IN ('super_admin', 'district_officer') FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
    SELECT role = 'super_admin' FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

ALTER TABLE public.circuits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrolment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.furniture ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.special_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.infrastructure ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Circuits policies
DROP POLICY IF EXISTS "Admins have full access to circuits" ON public.circuits;
CREATE POLICY "Admins have full access to circuits" ON public.circuits FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Headteachers can view circuits for their school" ON public.circuits;
CREATE POLICY "Headteachers can view circuits for their school" ON public.circuits FOR SELECT USING (
    public.get_user_role() = 'headteacher' AND id IN (SELECT circuit_id FROM public.schools WHERE id = public.get_user_school_id())
);

-- Schools policies
DROP POLICY IF EXISTS "Admins have full access to schools" ON public.schools;
CREATE POLICY "Admins have full access to schools" ON public.schools FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Headteachers can only view their own school" ON public.schools;
CREATE POLICY "Headteachers can only view their own school" ON public.schools FOR SELECT USING (
    public.get_user_role() = 'headteacher' AND id = public.get_user_school_id()
);

-- Profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Super Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Super Admins can manage all profiles" ON public.profiles FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "District Officers can view profiles" ON public.profiles;
CREATE POLICY "District Officers can view profiles" ON public.profiles FOR SELECT USING (public.is_admin());

-- Rounds policies
DROP POLICY IF EXISTS "Admins have full access to rounds" ON public.rounds;
CREATE POLICY "Admins have full access to rounds" ON public.rounds FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Headteachers can view rounds" ON public.rounds;
CREATE POLICY "Headteachers can view rounds" ON public.rounds FOR SELECT USING (public.get_user_role() = 'headteacher');

-- Submissions policies
DROP POLICY IF EXISTS "Admins have full access to submissions" ON public.submissions;
CREATE POLICY "Admins have full access to submissions" ON public.submissions FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Headteachers view own school submissions" ON public.submissions;
CREATE POLICY "Headteachers view own school submissions" ON public.submissions FOR SELECT USING (
    public.get_user_role() = 'headteacher' AND school_id = public.get_user_school_id()
);

DROP POLICY IF EXISTS "Headteachers create own school submission" ON public.submissions;
CREATE POLICY "Headteachers create own school submission" ON public.submissions FOR INSERT WITH CHECK (
    public.get_user_role() = 'headteacher' AND school_id = public.get_user_school_id()
);

DROP POLICY IF EXISTS "Headteachers update own draft submission" ON public.submissions;
CREATE POLICY "Headteachers update own draft submission" ON public.submissions FOR UPDATE USING (
    public.get_user_role() = 'headteacher' AND school_id = public.get_user_school_id() AND status IN ('draft', 'reopened')
) WITH CHECK (
    public.get_user_role() = 'headteacher' AND school_id = public.get_user_school_id()
);

-- Child tables owner helper
CREATE OR REPLACE FUNCTION public.is_headteacher_submission_owner(sub_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.submissions
        WHERE id = sub_id AND school_id = public.get_user_school_id()
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Submission levels, enrolment, teachers, classrooms, furniture, payroll, special teachers, infrastructure
DROP POLICY IF EXISTS "Admins submission_levels" ON public.submission_levels;
CREATE POLICY "Admins submission_levels" ON public.submission_levels FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Headteachers submission_levels" ON public.submission_levels;
CREATE POLICY "Headteachers submission_levels" ON public.submission_levels FOR ALL USING (public.is_headteacher_submission_owner(submission_id)) WITH CHECK (public.is_headteacher_submission_owner(submission_id));

DROP POLICY IF EXISTS "Admins enrolment" ON public.enrolment;
CREATE POLICY "Admins enrolment" ON public.enrolment FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Headteachers enrolment" ON public.enrolment;
CREATE POLICY "Headteachers enrolment" ON public.enrolment FOR ALL USING (public.is_headteacher_submission_owner(submission_id)) WITH CHECK (public.is_headteacher_submission_owner(submission_id));

DROP POLICY IF EXISTS "Admins teachers" ON public.teachers;
CREATE POLICY "Admins teachers" ON public.teachers FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Headteachers teachers" ON public.teachers;
CREATE POLICY "Headteachers teachers" ON public.teachers FOR ALL USING (public.is_headteacher_submission_owner(submission_id)) WITH CHECK (public.is_headteacher_submission_owner(submission_id));

DROP POLICY IF EXISTS "Admins classrooms" ON public.classrooms;
CREATE POLICY "Admins classrooms" ON public.classrooms FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Headteachers classrooms" ON public.classrooms;
CREATE POLICY "Headteachers classrooms" ON public.classrooms FOR ALL USING (public.is_headteacher_submission_owner(submission_id)) WITH CHECK (public.is_headteacher_submission_owner(submission_id));

DROP POLICY IF EXISTS "Admins furniture" ON public.furniture;
CREATE POLICY "Admins furniture" ON public.furniture FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Headteachers furniture" ON public.furniture;
CREATE POLICY "Headteachers furniture" ON public.furniture FOR ALL USING (public.is_headteacher_submission_owner(submission_id)) WITH CHECK (public.is_headteacher_submission_owner(submission_id));

DROP POLICY IF EXISTS "Admins staff_payroll" ON public.staff_payroll;
CREATE POLICY "Admins staff_payroll" ON public.staff_payroll FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Headteachers staff_payroll" ON public.staff_payroll;
CREATE POLICY "Headteachers staff_payroll" ON public.staff_payroll FOR ALL USING (public.is_headteacher_submission_owner(submission_id)) WITH CHECK (public.is_headteacher_submission_owner(submission_id));

DROP POLICY IF EXISTS "Admins special_teachers" ON public.special_teachers;
CREATE POLICY "Admins special_teachers" ON public.special_teachers FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Headteachers special_teachers" ON public.special_teachers;
CREATE POLICY "Headteachers special_teachers" ON public.special_teachers FOR ALL USING (public.is_headteacher_submission_owner(submission_id)) WITH CHECK (public.is_headteacher_submission_owner(submission_id));

DROP POLICY IF EXISTS "Admins infrastructure" ON public.infrastructure;
CREATE POLICY "Admins infrastructure" ON public.infrastructure FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Headteachers infrastructure" ON public.infrastructure;
CREATE POLICY "Headteachers infrastructure" ON public.infrastructure FOR ALL USING (public.is_headteacher_submission_owner(submission_id)) WITH CHECK (public.is_headteacher_submission_owner(submission_id));

DROP POLICY IF EXISTS "Admins notifications" ON public.notifications;
CREATE POLICY "Admins notifications" ON public.notifications FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Headteachers notifications" ON public.notifications;
CREATE POLICY "Headteachers notifications" ON public.notifications FOR SELECT USING (
    public.get_user_role() = 'headteacher' AND (school_id = public.get_user_school_id() OR school_id IS NULL)
);

DROP POLICY IF EXISTS "Admins audit_log" ON public.audit_log;
CREATE POLICY "Admins audit_log" ON public.audit_log FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "System insert audit_log" ON public.audit_log;
CREATE POLICY "System insert audit_log" ON public.audit_log FOR INSERT WITH CHECK (true);

-- ========================================================================
-- 3. PROVISION INITIAL SUPER ADMIN ACCOUNT
-- Email: admin@amdemis.local
-- Password: DistrictAdmin2026!
-- ========================================================================

DO $$
DECLARE
  super_admin_id UUID := '00000000-0000-0000-0000-000000000001'::UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@amdemis.local') THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      super_admin_id,
      'authenticated',
      'authenticated',
      'admin@amdemis.local',
      crypt('DistrictAdmin2026!', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"District Director / Super Admin","role":"super_admin"}'::jsonb,
      now(),
      now()
    );
  ELSE
    SELECT id INTO super_admin_id FROM auth.users WHERE email = 'admin@amdemis.local';
    UPDATE auth.users 
    SET encrypted_password = crypt('DistrictAdmin2026!', gen_salt('bf')),
        email_confirmed_at = now()
    WHERE id = super_admin_id;
  END IF;

  INSERT INTO public.profiles (id, role, full_name, is_initial_pin, failed_attempts, created_at, updated_at)
  VALUES (super_admin_id, 'super_admin', 'District Director / Super Admin', false, 0, now(), now())
  ON CONFLICT (id) DO UPDATE SET role = 'super_admin', full_name = 'District Director / Super Admin';
END $$;
