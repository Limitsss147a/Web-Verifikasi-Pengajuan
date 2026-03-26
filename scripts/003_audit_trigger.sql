-- E-Budgeting System Audit Trigger
-- Run this after 002_rls_policies.sql

-- Create audit logging function
CREATE OR REPLACE FUNCTION log_audit()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data, new_data)
  VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to critical tables
DROP TRIGGER IF EXISTS budgets_audit ON budgets;
CREATE TRIGGER budgets_audit 
  AFTER INSERT OR UPDATE OR DELETE ON budgets
  FOR EACH ROW EXECUTE FUNCTION log_audit();

DROP TRIGGER IF EXISTS budget_items_audit ON budget_items;
CREATE TRIGGER budget_items_audit 
  AFTER INSERT OR UPDATE OR DELETE ON budget_items
  FOR EACH ROW EXECUTE FUNCTION log_audit();

DROP TRIGGER IF EXISTS revisions_audit ON revisions;
CREATE TRIGGER revisions_audit 
  AFTER INSERT OR UPDATE ON revisions
  FOR EACH ROW EXECUTE FUNCTION log_audit();

DROP TRIGGER IF EXISTS programs_audit ON programs;
CREATE TRIGGER programs_audit 
  AFTER INSERT OR UPDATE OR DELETE ON programs
  FOR EACH ROW EXECUTE FUNCTION log_audit();

DROP TRIGGER IF EXISTS activities_audit ON activities;
CREATE TRIGGER activities_audit 
  AFTER INSERT OR UPDATE OR DELETE ON activities
  FOR EACH ROW EXECUTE FUNCTION log_audit();

-- Function to create notification on budget status change
CREATE OR REPLACE FUNCTION notify_budget_status_change()
RETURNS TRIGGER AS $$
DECLARE
  notification_title TEXT;
  notification_message TEXT;
  notification_type TEXT;
BEGIN
  -- Only trigger on status change
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Determine notification content based on new status
    CASE NEW.status
      WHEN 'under_review' THEN
        notification_title := 'Anggaran Sedang Ditinjau';
        notification_message := 'Anggaran "' || NEW.title || '" sedang dalam proses peninjauan.';
        notification_type := 'status_change';
      WHEN 'revision' THEN
        notification_title := 'Revisi Diperlukan';
        notification_message := 'Anggaran "' || NEW.title || '" memerlukan revisi. Silakan periksa catatan reviewer.';
        notification_type := 'revision_request';
      WHEN 'approved' THEN
        notification_title := 'Anggaran Disetujui';
        notification_message := 'Selamat! Anggaran "' || NEW.title || '" telah disetujui.';
        notification_type := 'approval';
      WHEN 'rejected' THEN
        notification_title := 'Anggaran Ditolak';
        notification_message := 'Anggaran "' || NEW.title || '" telah ditolak. Silakan periksa catatan reviewer.';
        notification_type := 'rejection';
      ELSE
        notification_title := 'Status Anggaran Berubah';
        notification_message := 'Status anggaran "' || NEW.title || '" telah diubah menjadi ' || NEW.status || '.';
        notification_type := 'status_change';
    END CASE;
    
    -- Create notification for the budget submitter
    INSERT INTO notifications (user_id, title, message, type, related_budget_id)
    VALUES (NEW.submitted_by, notification_title, notification_message, notification_type, NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply notification trigger
DROP TRIGGER IF EXISTS budget_status_notification ON budgets;
CREATE TRIGGER budget_status_notification
  AFTER UPDATE ON budgets
  FOR EACH ROW EXECUTE FUNCTION notify_budget_status_change();

-- Function to update budget total amount when items change
CREATE OR REPLACE FUNCTION update_budget_total()
RETURNS TRIGGER AS $$
DECLARE
  new_total DECIMAL(15,2);
BEGIN
  -- Calculate new total from all items
  SELECT COALESCE(SUM(total_price), 0) INTO new_total
  FROM budget_items
  WHERE budget_id = COALESCE(NEW.budget_id, OLD.budget_id);
  
  -- Update the budget total
  UPDATE budgets 
  SET total_amount = new_total
  WHERE id = COALESCE(NEW.budget_id, OLD.budget_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply budget total trigger
DROP TRIGGER IF EXISTS update_budget_total_on_items ON budget_items;
CREATE TRIGGER update_budget_total_on_items
  AFTER INSERT OR UPDATE OR DELETE ON budget_items
  FOR EACH ROW EXECUTE FUNCTION update_budget_total();
