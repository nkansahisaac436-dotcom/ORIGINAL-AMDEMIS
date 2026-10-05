-- AMDEMIS Row Level Security Migration
-- Strict multi-tenant isolation by school and role-based access control

-- Security Definer helper functions to avoid recursion in RLS
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

-- Enable RLS on all tables
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

-- 1. CIRCUITS POLICIES
CREATE POLICY "Admins have full access to circuits"
    ON public.circuits
    FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Headteachers can view circuits for their school"
    ON public.circuits
    FOR SELECT
    USING (
        public.get_user_role() = 'headteacher' 
        AND id IN (SELECT circuit_id FROM public.schools WHERE id = public.get_user_school_id())
    );

-- 2. SCHOOLS POLICIES
CREATE POLICY "Admins have full access to schools"
    ON public.schools
    FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Headteachers can only view their own school"
    ON public.schools
    FOR SELECT
    USING (
        public.get_user_role() = 'headteacher' 
        AND id = public.get_user_school_id()
    );

CREATE POLICY "Headteachers can update basic contact on their own school"
    ON public.schools
    FOR UPDATE
    USING (
        public.get_user_role() = 'headteacher' 
        AND id = public.get_user_school_id()
    )
    WITH CHECK (
        public.get_user_role() = 'headteacher' 
        AND id = public.get_user_school_id()
    );

-- 3. PROFILES POLICIES
CREATE POLICY "Users can view their own profile"
    ON public.profiles
    FOR SELECT
    USING (id = auth.uid());

CREATE POLICY "Users can update their own profile (e.g. initial pin change)"
    ON public.profiles
    FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

CREATE POLICY "Super Admins can manage all profiles"
    ON public.profiles
    FOR ALL
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

CREATE POLICY "District Officers can view profiles"
    ON public.profiles
    FOR SELECT
    USING (public.is_admin());

-- 4. ROUNDS POLICIES
CREATE POLICY "Admins have full access to rounds"
    ON public.rounds
    FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Headteachers can view rounds"
    ON public.rounds
    FOR SELECT
    USING (public.get_user_role() = 'headteacher');

-- 5. SUBMISSIONS POLICIES
CREATE POLICY "Admins have full access to submissions"
    ON public.submissions
    FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Headteachers can view their own school submissions"
    ON public.submissions
    FOR SELECT
    USING (
        public.get_user_role() = 'headteacher' 
        AND school_id = public.get_user_school_id()
    );

CREATE POLICY "Headteachers can create their own school submission for active rounds"
    ON public.submissions
    FOR INSERT
    WITH CHECK (
        public.get_user_role() = 'headteacher' 
        AND school_id = public.get_user_school_id()
        AND round_id IN (SELECT id FROM public.rounds WHERE is_active = true AND is_locked = false)
    );

CREATE POLICY "Headteachers can update their own draft or reopened submission"
    ON public.submissions
    FOR UPDATE
    USING (
        public.get_user_role() = 'headteacher' 
        AND school_id = public.get_user_school_id()
        AND status IN ('draft', 'reopened')
        AND round_id IN (SELECT id FROM public.rounds WHERE is_active = true AND is_locked = false)
    )
    WITH CHECK (
        public.get_user_role() = 'headteacher' 
        AND school_id = public.get_user_school_id()
        AND round_id IN (SELECT id FROM public.rounds WHERE is_active = true AND is_locked = false)
    );

-- Helper macro function for child tables isolation
CREATE OR REPLACE FUNCTION public.is_headteacher_submission_owner(sub_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.submissions
        WHERE id = sub_id
        AND school_id = public.get_user_school_id()
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 6. SUBMISSION_LEVELS POLICIES
CREATE POLICY "Admins full access to submission_levels"
    ON public.submission_levels FOR ALL
    USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Headteachers access own submission_levels"
    ON public.submission_levels FOR ALL
    USING (public.is_headteacher_submission_owner(submission_id))
    WITH CHECK (public.is_headteacher_submission_owner(submission_id));

-- 7. ENROLMENT POLICIES
CREATE POLICY "Admins full access to enrolment"
    ON public.enrolment FOR ALL
    USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Headteachers access own enrolment"
    ON public.enrolment FOR ALL
    USING (public.is_headteacher_submission_owner(submission_id))
    WITH CHECK (public.is_headteacher_submission_owner(submission_id));

-- 8. TEACHERS POLICIES
CREATE POLICY "Admins full access to teachers"
    ON public.teachers FOR ALL
    USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Headteachers access own teachers"
    ON public.teachers FOR ALL
    USING (public.is_headteacher_submission_owner(submission_id))
    WITH CHECK (public.is_headteacher_submission_owner(submission_id));

-- 9. CLASSROOMS POLICIES
CREATE POLICY "Admins full access to classrooms"
    ON public.classrooms FOR ALL
    USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Headteachers access own classrooms"
    ON public.classrooms FOR ALL
    USING (public.is_headteacher_submission_owner(submission_id))
    WITH CHECK (public.is_headteacher_submission_owner(submission_id));

-- 10. FURNITURE POLICIES
CREATE POLICY "Admins full access to furniture"
    ON public.furniture FOR ALL
    USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Headteachers access own furniture"
    ON public.furniture FOR ALL
    USING (public.is_headteacher_submission_owner(submission_id))
    WITH CHECK (public.is_headteacher_submission_owner(submission_id));

-- 11. STAFF_PAYROLL POLICIES
CREATE POLICY "Admins full access to staff_payroll"
    ON public.staff_payroll FOR ALL
    USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Headteachers access own staff_payroll"
    ON public.staff_payroll FOR ALL
    USING (public.is_headteacher_submission_owner(submission_id))
    WITH CHECK (public.is_headteacher_submission_owner(submission_id));

-- 12. SPECIAL_TEACHERS POLICIES
CREATE POLICY "Admins full access to special_teachers"
    ON public.special_teachers FOR ALL
    USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Headteachers access own special_teachers"
    ON public.special_teachers FOR ALL
    USING (public.is_headteacher_submission_owner(submission_id))
    WITH CHECK (public.is_headteacher_submission_owner(submission_id));

-- 13. INFRASTRUCTURE POLICIES
CREATE POLICY "Admins full access to infrastructure"
    ON public.infrastructure FOR ALL
    USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Headteachers access own infrastructure"
    ON public.infrastructure FOR ALL
    USING (public.is_headteacher_submission_owner(submission_id))
    WITH CHECK (public.is_headteacher_submission_owner(submission_id));

-- 14. NOTIFICATIONS POLICIES
CREATE POLICY "Admins full access to notifications"
    ON public.notifications FOR ALL
    USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Headteachers view own notifications"
    ON public.notifications FOR SELECT
    USING (
        public.get_user_role() = 'headteacher' 
        AND (school_id = public.get_user_school_id() OR school_id IS NULL)
    );

CREATE POLICY "Headteachers update own notifications (mark read)"
    ON public.notifications FOR UPDATE
    USING (
        public.get_user_role() = 'headteacher' 
        AND (school_id = public.get_user_school_id() OR school_id IS NULL)
    )
    WITH CHECK (
        public.get_user_role() = 'headteacher' 
        AND (school_id = public.get_user_school_id() OR school_id IS NULL)
    );

-- 15. AUDIT_LOG POLICIES
CREATE POLICY "Admins view audit_log"
    ON public.audit_log FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Admins and System insert audit_log"
    ON public.audit_log FOR INSERT
    WITH CHECK (true);
