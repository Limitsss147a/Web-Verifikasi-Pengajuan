-- Add free text columns for Program, Activity, and Sub Activity
-- so users can directly type them instead of selecting from predefined masters.

ALTER TABLE public.budgets
ADD COLUMN IF NOT EXISTS program_name TEXT,
ADD COLUMN IF NOT EXISTS activity_name TEXT,
ADD COLUMN IF NOT EXISTS sub_activity_name TEXT;
