-- AMDEMIS Auth Functions & Security Helpers

-- 1. Helper function to record a failed login attempt and lock if needed (5 attempts -> 15 min lock)
CREATE OR REPLACE FUNCTION public.handle_failed_login(user_email TEXT)
RETURNS JSONB AS $$
DECLARE
    target_user_id UUID;
    cur_attempts INTEGER;
    lock_time TIMESTAMPTZ;
BEGIN
    SELECT id INTO target_user_id FROM auth.users WHERE email = lower(user_email);
    
    IF target_user_id IS NULL THEN
        -- Do not reveal user existence
        RETURN jsonb_build_object('locked', false, 'attempts', 0);
    END IF;

    UPDATE public.profiles
    SET failed_attempts = failed_attempts + 1,
        locked_until = CASE 
            WHEN failed_attempts + 1 >= 5 THEN timezone('utc'::text, now()) + INTERVAL '15 minutes'
            ELSE locked_until
        END,
        updated_at = timezone('utc'::text, now())
    WHERE id = target_user_id
    RETURNING failed_attempts, locked_until INTO cur_attempts, lock_time;

    RETURN jsonb_build_object(
        'locked', (lock_time IS NOT NULL AND lock_time > timezone('utc'::text, now())),
        'attempts', cur_attempts
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Helper function to reset failed login attempts on successful authentication
CREATE OR REPLACE FUNCTION public.handle_successful_login(user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.profiles
    SET failed_attempts = 0,
        locked_until = NULL,
        updated_at = timezone('utc'::text, now())
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger for logging submission status changes in audit_log
CREATE OR REPLACE FUNCTION public.log_submission_audit()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        IF (OLD.status <> NEW.status) THEN
            INSERT INTO public.audit_log (user_id, action, target_type, target_id, details)
            VALUES (
                auth.uid(),
                'SUBMISSION_STATUS_CHANGE',
                'submission',
                NEW.id,
                jsonb_build_object(
                    'school_id', NEW.school_id,
                    'round_id', NEW.round_id,
                    'old_status', OLD.status,
                    'new_status', NEW.status,
                    'reopened_reason', NEW.reopened_reason
                )
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trigger_submission_audit
    AFTER UPDATE ON public.submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.log_submission_audit();
