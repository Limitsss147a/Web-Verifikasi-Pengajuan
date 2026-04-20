-- Function to get dashboard statistics efficiently
CREATE OR REPLACE FUNCTION get_dashboard_stats(user_id UUID, is_admin_user BOOLEAN)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
    target_institution_id UUID;
BEGIN
    -- If not admin, get the user's institution
    IF NOT is_admin_user THEN
        SELECT institution_id INTO target_institution_id FROM profiles WHERE id = user_id;
    END IF;

    WITH status_counts AS (
        SELECT 
            status, 
            COUNT(*) as count,
            COALESCE(SUM(total_amount), 0) as total_val
        FROM budgets
        WHERE (is_admin_user OR institution_id = target_institution_id)
        GROUP BY status
    ),
    summary AS (
        SELECT 
            COALESCE(SUM(count), 0) as total_count,
            COALESCE(SUM(total_val), 0) as grand_total_amount,
            COALESCE(SUM(CASE WHEN status = 'approved' THEN total_val ELSE 0 END), 0) as approved_total_amount,
            COALESCE(SUM(CASE WHEN status = 'submitted' THEN count ELSE 0 END), 0) as submitted_count,
            COALESCE(SUM(CASE WHEN status = 'under_review' THEN count ELSE 0 END), 0) as under_review_count,
            COALESCE(SUM(CASE WHEN status = 'approved' THEN count ELSE 0 END), 0) as approved_count,
            COALESCE(SUM(CASE WHEN status = 'rejected' THEN count ELSE 0 END), 0) as rejected_count,
            COALESCE(SUM(CASE WHEN status = 'revision' THEN count ELSE 0 END), 0) as revision_count,
            COALESCE(SUM(CASE WHEN status = 'draft' THEN count ELSE 0 END), 0) as draft_count
        FROM status_counts
    ),
    status_array AS (
        SELECT jsonb_agg(jsonb_build_object('status', status, 'count', count)) as data
        FROM status_counts
    )
    SELECT jsonb_build_object(
        'summary', (SELECT row_to_json(summary) FROM summary),
        'status_distribution', (SELECT data FROM status_array)
    ) INTO result;

    RETURN result;
END;
$$;
