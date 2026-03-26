-- E-Budgeting System Row Level Security Policies
-- Run this after 001_core_tables.sql

-- Enable RLS on all tables
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscal_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper function to get user institution
CREATE OR REPLACE FUNCTION get_user_institution()
RETURNS UUID AS $$
  SELECT institution_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ==================== INSTITUTIONS POLICIES ====================
DROP POLICY IF EXISTS "institutions_select" ON institutions;
CREATE POLICY "institutions_select" ON institutions FOR SELECT
  USING (id = get_user_institution() OR is_admin());

DROP POLICY IF EXISTS "institutions_insert" ON institutions;
CREATE POLICY "institutions_insert" ON institutions FOR INSERT
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "institutions_update" ON institutions;
CREATE POLICY "institutions_update" ON institutions FOR UPDATE
  USING (is_admin());

DROP POLICY IF EXISTS "institutions_delete" ON institutions;
CREATE POLICY "institutions_delete" ON institutions FOR DELETE
  USING (is_admin());

-- ==================== PROFILES POLICIES ====================
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT
  USING (id = auth.uid() OR is_admin() OR institution_id = get_user_institution());

DROP POLICY IF EXISTS "profiles_insert" ON profiles;
CREATE POLICY "profiles_insert" ON profiles FOR INSERT
  WITH CHECK (id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  USING (id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "profiles_delete" ON profiles;
CREATE POLICY "profiles_delete" ON profiles FOR DELETE
  USING (is_admin());

-- ==================== FISCAL YEARS POLICIES ====================
DROP POLICY IF EXISTS "fiscal_years_select" ON fiscal_years;
CREATE POLICY "fiscal_years_select" ON fiscal_years FOR SELECT
  USING (true); -- Everyone can see fiscal years

DROP POLICY IF EXISTS "fiscal_years_manage" ON fiscal_years;
CREATE POLICY "fiscal_years_manage" ON fiscal_years FOR ALL
  USING (is_admin());

-- ==================== PROGRAMS POLICIES ====================
DROP POLICY IF EXISTS "programs_select" ON programs;
CREATE POLICY "programs_select" ON programs FOR SELECT
  USING (institution_id = get_user_institution() OR is_admin());

DROP POLICY IF EXISTS "programs_insert" ON programs;
CREATE POLICY "programs_insert" ON programs FOR INSERT
  WITH CHECK (institution_id = get_user_institution() OR is_admin());

DROP POLICY IF EXISTS "programs_update" ON programs;
CREATE POLICY "programs_update" ON programs FOR UPDATE
  USING (institution_id = get_user_institution() OR is_admin());

DROP POLICY IF EXISTS "programs_delete" ON programs;
CREATE POLICY "programs_delete" ON programs FOR DELETE
  USING (is_admin());

-- ==================== ACTIVITIES POLICIES ====================
DROP POLICY IF EXISTS "activities_select" ON activities;
CREATE POLICY "activities_select" ON activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM programs p 
      WHERE p.id = activities.program_id 
      AND (p.institution_id = get_user_institution() OR is_admin())
    )
  );

DROP POLICY IF EXISTS "activities_insert" ON activities;
CREATE POLICY "activities_insert" ON activities FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM programs p 
      WHERE p.id = activities.program_id 
      AND (p.institution_id = get_user_institution() OR is_admin())
    )
  );

DROP POLICY IF EXISTS "activities_update" ON activities;
CREATE POLICY "activities_update" ON activities FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM programs p 
      WHERE p.id = activities.program_id 
      AND (p.institution_id = get_user_institution() OR is_admin())
    )
  );

DROP POLICY IF EXISTS "activities_delete" ON activities;
CREATE POLICY "activities_delete" ON activities FOR DELETE
  USING (is_admin());

-- ==================== SUB_ACTIVITIES POLICIES ====================
DROP POLICY IF EXISTS "sub_activities_select" ON sub_activities;
CREATE POLICY "sub_activities_select" ON sub_activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM activities a
      JOIN programs p ON p.id = a.program_id
      WHERE a.id = sub_activities.activity_id 
      AND (p.institution_id = get_user_institution() OR is_admin())
    )
  );

DROP POLICY IF EXISTS "sub_activities_insert" ON sub_activities;
CREATE POLICY "sub_activities_insert" ON sub_activities FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM activities a
      JOIN programs p ON p.id = a.program_id
      WHERE a.id = sub_activities.activity_id 
      AND (p.institution_id = get_user_institution() OR is_admin())
    )
  );

DROP POLICY IF EXISTS "sub_activities_update" ON sub_activities;
CREATE POLICY "sub_activities_update" ON sub_activities FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM activities a
      JOIN programs p ON p.id = a.program_id
      WHERE a.id = sub_activities.activity_id 
      AND (p.institution_id = get_user_institution() OR is_admin())
    )
  );

DROP POLICY IF EXISTS "sub_activities_delete" ON sub_activities;
CREATE POLICY "sub_activities_delete" ON sub_activities FOR DELETE
  USING (is_admin());

-- ==================== BUDGETS POLICIES (CRITICAL) ====================
DROP POLICY IF EXISTS "budgets_select" ON budgets;
CREATE POLICY "budgets_select" ON budgets FOR SELECT
  USING (institution_id = get_user_institution() OR is_admin());

DROP POLICY IF EXISTS "budgets_insert" ON budgets;
CREATE POLICY "budgets_insert" ON budgets FOR INSERT
  WITH CHECK (
    institution_id = get_user_institution() 
    AND submitted_by = auth.uid()
  );

DROP POLICY IF EXISTS "budgets_update_own" ON budgets;
CREATE POLICY "budgets_update_own" ON budgets FOR UPDATE
  USING (
    (institution_id = get_user_institution() AND submitted_by = auth.uid() AND status IN ('draft', 'revision'))
    OR is_admin()
  );

DROP POLICY IF EXISTS "budgets_delete" ON budgets;
CREATE POLICY "budgets_delete" ON budgets FOR DELETE
  USING (
    (institution_id = get_user_institution() AND submitted_by = auth.uid() AND status = 'draft')
    OR is_admin()
  );

-- ==================== BUDGET ITEMS POLICIES ====================
DROP POLICY IF EXISTS "budget_items_select" ON budget_items;
CREATE POLICY "budget_items_select" ON budget_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM budgets b 
      WHERE b.id = budget_items.budget_id 
      AND (b.institution_id = get_user_institution() OR is_admin())
    )
  );

DROP POLICY IF EXISTS "budget_items_insert" ON budget_items;
CREATE POLICY "budget_items_insert" ON budget_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM budgets b 
      WHERE b.id = budget_items.budget_id 
      AND b.institution_id = get_user_institution()
      AND b.submitted_by = auth.uid()
      AND b.status IN ('draft', 'revision')
    ) OR is_admin()
  );

DROP POLICY IF EXISTS "budget_items_update" ON budget_items;
CREATE POLICY "budget_items_update" ON budget_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM budgets b 
      WHERE b.id = budget_items.budget_id 
      AND b.institution_id = get_user_institution()
      AND b.submitted_by = auth.uid()
      AND b.status IN ('draft', 'revision')
    ) OR is_admin()
  );

DROP POLICY IF EXISTS "budget_items_delete" ON budget_items;
CREATE POLICY "budget_items_delete" ON budget_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM budgets b 
      WHERE b.id = budget_items.budget_id 
      AND b.institution_id = get_user_institution()
      AND b.submitted_by = auth.uid()
      AND b.status IN ('draft', 'revision')
    ) OR is_admin()
  );

-- ==================== BUDGET DOCUMENTS POLICIES ====================
DROP POLICY IF EXISTS "budget_documents_select" ON budget_documents;
CREATE POLICY "budget_documents_select" ON budget_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM budgets b 
      WHERE b.id = budget_documents.budget_id 
      AND (b.institution_id = get_user_institution() OR is_admin())
    )
  );

DROP POLICY IF EXISTS "budget_documents_insert" ON budget_documents;
CREATE POLICY "budget_documents_insert" ON budget_documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM budgets b 
      WHERE b.id = budget_documents.budget_id 
      AND b.institution_id = get_user_institution()
      AND b.submitted_by = auth.uid()
    ) OR is_admin()
  );

DROP POLICY IF EXISTS "budget_documents_delete" ON budget_documents;
CREATE POLICY "budget_documents_delete" ON budget_documents FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM budgets b 
      WHERE b.id = budget_documents.budget_id 
      AND b.institution_id = get_user_institution()
      AND b.submitted_by = auth.uid()
      AND b.status IN ('draft', 'revision')
    ) OR is_admin()
  );

-- ==================== REVISIONS POLICIES ====================
DROP POLICY IF EXISTS "revisions_select" ON revisions;
CREATE POLICY "revisions_select" ON revisions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM budgets b 
      WHERE b.id = revisions.budget_id 
      AND (b.institution_id = get_user_institution() OR is_admin())
    )
  );

DROP POLICY IF EXISTS "revisions_insert" ON revisions;
CREATE POLICY "revisions_insert" ON revisions FOR INSERT
  WITH CHECK (is_admin() OR reviewer_id = auth.uid());

-- ==================== AUDIT LOGS POLICIES ====================
DROP POLICY IF EXISTS "audit_logs_select" ON audit_logs;
CREATE POLICY "audit_logs_select" ON audit_logs FOR SELECT
  USING (is_admin());

DROP POLICY IF EXISTS "audit_logs_insert" ON audit_logs;
CREATE POLICY "audit_logs_insert" ON audit_logs FOR INSERT
  WITH CHECK (true); -- Allow system to insert audit logs

-- ==================== NOTIFICATIONS POLICIES ====================
DROP POLICY IF EXISTS "notifications_select" ON notifications;
CREATE POLICY "notifications_select" ON notifications FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_update" ON notifications;
CREATE POLICY "notifications_update" ON notifications FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_insert" ON notifications;
CREATE POLICY "notifications_insert" ON notifications FOR INSERT
  WITH CHECK (true); -- Allow system to insert notifications
