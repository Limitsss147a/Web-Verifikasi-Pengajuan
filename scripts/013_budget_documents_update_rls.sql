-- E-Budgeting System Row Level Security Policies
-- Update to allow admins to execute specific actions on `budget_documents`.

-- Allow admin to update documents. This is critical for recording verification reviews (`review_bapperida`, dll).
DROP POLICY IF EXISTS "budget_documents_update" ON budget_documents;
CREATE POLICY "budget_documents_update" ON budget_documents FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());
