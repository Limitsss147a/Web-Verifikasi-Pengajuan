-- Create audit_log table
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address TEXT
);

-- Enable RLS on audit_log
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Only superusers or specific roles should view audit logs
CREATE POLICY "Admins can view audit logs" ON public.audit_log
    FOR SELECT
    USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

-- Function to handle audit triggers
CREATE OR REPLACE FUNCTION public.handle_audit_trigger()
RETURNS TRIGGER AS $$
DECLARE
    old_record JSONB := NULL;
    new_record JSONB := NULL;
    user_id UUID := auth.uid();
BEGIN
    IF (TG_OP = 'DELETE') THEN
        old_record := to_jsonb(OLD);
    ELSIF (TG_OP = 'UPDATE') THEN
        old_record := to_jsonb(OLD);
        new_record := to_jsonb(NEW);
    ELSIF (TG_OP = 'INSERT') THEN
        new_record := to_jsonb(NEW);
    END IF;

    -- We cannot easily capture IP address from inside a trigger without passing it via a config variable
    -- For Supabase, the best we can do is get the auth.uid()
    INSERT INTO public.audit_log (table_name, operation, record_id, old_data, new_data, changed_by)
    VALUES (
        TG_TABLE_NAME,
        TG_OP,
        COALESCE(NEW.id, OLD.id),
        old_record,
        new_record,
        user_id
    );

    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Example: Attach the trigger to a budget table (assuming it's called "budgets")
-- DROP TRIGGER IF EXISTS audit_budgets_trigger ON public.budgets;
-- CREATE TRIGGER audit_budgets_trigger
-- AFTER INSERT OR UPDATE OR DELETE ON public.budgets
-- FOR EACH ROW EXECUTE FUNCTION public.handle_audit_trigger();
