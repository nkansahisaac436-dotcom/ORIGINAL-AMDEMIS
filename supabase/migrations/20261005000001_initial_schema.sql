-- AMDEMIS Initial Database Schema Migration
-- Atwima Mponua District Education Management Information System
-- Planning & Statistics Unit, Ghana

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Circuits Table
CREATE TABLE IF NOT EXISTS public.circuits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    code TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Schools Table
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

-- 3. Profiles Table (Linked with Supabase auth.users)
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

-- 4. Collection Rounds Table
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

-- 5. Submissions Table
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

-- 6. Submission Chosen Levels Table (Configurable per round submission)
CREATE TABLE IF NOT EXISTS public.submission_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
    level TEXT NOT NULL CHECK (level IN ('creche', 'kg', 'primary', 'jhs', 'shs')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_submission_level UNIQUE (submission_id, level)
);

-- 7. Normalized Enrolment Table
CREATE TABLE IF NOT EXISTS public.enrolment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
    level TEXT NOT NULL CHECK (level IN ('creche', 'kg', 'primary', 'jhs', 'shs')),
    class_name TEXT NOT NULL, -- 'creche', 'KG1', 'KG2', 'BS1'..'BS6', 'JHS1'..'JHS3'
    gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
    age_band TEXT NOT NULL DEFAULT 'all', -- 'all', 'age_4', 'age_5', 'age_4_5', 'age_6', 'age_6_11', 'age_12', 'age_12_14'
    count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_enrolment_record UNIQUE (submission_id, level, class_name, gender, age_band)
);

-- 8. Normalized Teachers Table
CREATE TABLE IF NOT EXISTS public.teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
    level TEXT NOT NULL CHECK (level IN ('creche', 'kg', 'primary', 'jhs', 'shs')),
    class_name TEXT NOT NULL DEFAULT 'all', -- 'all', 'KG1', 'KG2', 'BS1'..'BS6'
    gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
    is_trained BOOLEAN NOT NULL DEFAULT true,
    count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_teachers_record UNIQUE (submission_id, level, class_name, gender, is_trained)
);

-- 9. Normalized Classrooms Table
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

-- 10. Normalized Furniture Table
CREATE TABLE IF NOT EXISTS public.furniture (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
    level TEXT NOT NULL CHECK (level IN ('creche', 'kg', 'primary', 'jhs', 'shs')),
    furniture_type TEXT NOT NULL CHECK (furniture_type IN ('mono_desk', 'dual_desk', 'others')),
    count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_furniture_record UNIQUE (submission_id, level, furniture_type)
);

-- 11. Staff Payroll (Non-teaching staff)
CREATE TABLE IF NOT EXISTS public.staff_payroll (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
    level_group TEXT NOT NULL CHECK (level_group IN ('kg_primary', 'jhs')),
    male_count INTEGER NOT NULL DEFAULT 0 CHECK (male_count >= 0),
    female_count INTEGER NOT NULL DEFAULT 0 CHECK (female_count >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_staff_payroll UNIQUE (submission_id, level_group)
);

-- 12. Special Teachers (e.g. French, Arabic in JHS)
CREATE TABLE IF NOT EXISTS public.special_teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
    subject TEXT NOT NULL CHECK (subject IN ('french', 'arabic')),
    has_teacher BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_special_teacher UNIQUE (submission_id, subject)
);

-- 13. Infrastructure Table
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

-- 14. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('deadline', 'reopened', 'info', 'reminder')),
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 15. Audit Log Table
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id UUID,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Auto sequence / trigger for School Login ID format (AMD-0001, AMD-0002)
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

CREATE OR REPLACE TRIGGER trigger_school_login_id
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
