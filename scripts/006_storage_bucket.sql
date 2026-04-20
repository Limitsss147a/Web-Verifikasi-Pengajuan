-- Create a specific storage bucket for budget documents if it doesn't already exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('budget_documents', 'budget_documents', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- RLS Policies for the budget_documents storage bucket
-- IMPORTANT: These policies restrict file access based on budget ownership.
-- Users can only access files belonging to budgets from their own institution.
-- ============================================================================

-- Drop old overly-permissive policies (if they exist)
DROP POLICY IF EXISTS "Users can view their own budget documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload budget documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own budget documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own budget documents" ON storage.objects;

-- Allow users to view files only for budgets belonging to their institution (or admin)
CREATE POLICY "Budget docs: scoped SELECT"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'budget_documents'
  AND auth.role() = 'authenticated'
  AND (
    -- Admins can view all documents
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR
    -- Users can only view documents linked to their institution's budgets
    -- The file_path convention is: <budget_id>/filename
    EXISTS (
      SELECT 1 FROM budgets b
      JOIN profiles p ON p.id = auth.uid()
      WHERE b.institution_id = p.institution_id
      AND (storage.foldername(name))[1] = b.id::text
    )
  )
);

-- Allow authenticated users to upload documents only for their own budgets
CREATE POLICY "Budget docs: scoped INSERT"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'budget_documents'
  AND auth.role() = 'authenticated'
  AND (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR
    EXISTS (
      SELECT 1 FROM budgets b
      JOIN profiles p ON p.id = auth.uid()
      WHERE b.institution_id = p.institution_id
      AND b.submitted_by = auth.uid()
      AND (storage.foldername(name))[1] = b.id::text
    )
  )
);

-- Allow users to update only their own uploaded documents
CREATE POLICY "Budget docs: owner UPDATE"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'budget_documents'
  AND auth.uid() = owner
);

-- Allow users to delete only their own uploaded documents
CREATE POLICY "Budget docs: owner DELETE"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'budget_documents'
  AND (
    auth.uid() = owner
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
);
