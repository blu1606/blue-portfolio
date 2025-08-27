-- ===================================================
-- SUPABASE MANUAL MIGRATION SCRIPT - PART 3 (FINAL)
-- Copy and paste this into Supabase SQL Editor AFTER Part 2
-- ===================================================

-- ===================================================
-- STEP 7: CREATE UTILITY FUNCTIONS
-- ===================================================

-- Function to get feedback count by IP for rate limiting
CREATE OR REPLACE FUNCTION get_feedback_count_by_ip(
    ip_addr INET,
    time_window_hours INTEGER DEFAULT 24
)
RETURNS INTEGER AS $$
DECLARE
    feedback_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO feedback_count
    FROM feedbacks
    WHERE ip_address = ip_addr
    AND created_at >= NOW() - INTERVAL '1 hour' * time_window_hours;
    
    RETURN COALESCE(feedback_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check duplicate feedback by IP
CREATE OR REPLACE FUNCTION check_duplicate_feedback_by_ip(
    ip_addr INET,
    time_window_minutes INTEGER DEFAULT 30
)
RETURNS BOOLEAN AS $$
DECLARE
    feedback_exists BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1
        FROM feedbacks
        WHERE ip_address = ip_addr
        AND created_at >= NOW() - INTERVAL '1 minute' * time_window_minutes
    ) INTO feedback_exists;
    
    RETURN feedback_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================================
-- STEP 8: CREATE/UPDATE VIEWS
-- ===================================================

-- Drop existing views if they exist
DROP VIEW IF EXISTS approved_feedbacks;

-- Create updated view for approved feedbacks
CREATE VIEW approved_feedbacks AS
SELECT 
    f.id,
    f.content,
    f.rating,
    f.images,
    f.is_anonymous,
    f.created_at,
    f.approved_at,
    -- User info for authenticated feedback
    CASE 
        WHEN f.is_anonymous = false AND u.full_name IS NOT NULL THEN u.full_name
        ELSE f.author_name
    END as author_name,
    CASE 
        WHEN f.is_anonymous = false AND u.avatar_url IS NOT NULL THEN u.avatar_url
        ELSE f.author_avatar_url
    END as author_avatar_url,
    CASE 
        WHEN f.is_anonymous = false AND u.email IS NOT NULL THEN u.email
        ELSE f.author_email
    END as author_email
FROM feedbacks f
LEFT JOIN auth.users u ON f.user_id = u.id
WHERE f.is_approved = true
ORDER BY f.created_at DESC;

-- ===================================================
-- STEP 9: UPDATE ROW LEVEL SECURITY
-- ===================================================

-- Enable RLS on feedbacks if not already enabled
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Approved feedbacks are viewable by everyone" ON feedbacks;
DROP POLICY IF EXISTS "Anyone can insert feedback" ON feedbacks;
DROP POLICY IF EXISTS "Users can view their own feedbacks" ON feedbacks;

-- Recreate policies
CREATE POLICY "Approved feedbacks are viewable by everyone" ON feedbacks
    FOR SELECT USING (is_approved = true);

CREATE POLICY "Anyone can insert feedback" ON feedbacks
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own feedbacks" ON feedbacks
    FOR SELECT USING (
        auth.uid() = user_id OR 
        is_approved = true
    );

-- Enable RLS on new tables
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- Policies for media
CREATE POLICY "Media is viewable by everyone" ON media
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own media" ON media
    FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

-- Policies for analytics (restrictive)
CREATE POLICY "Analytics insert for all" ON analytics
    FOR INSERT WITH CHECK (true);

-- ===================================================
-- STEP 10: ADD TRIGGERS
-- ===================================================

-- Update triggers for timestamp columns
CREATE TRIGGER IF NOT EXISTS update_feedbacks_updated_at 
    BEFORE UPDATE ON feedbacks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_media_updated_at 
    BEFORE UPDATE ON media 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================================================
-- VERIFICATION
-- ===================================================

-- Check if migration was successful
DO $$
DECLARE
    column_count INTEGER;
BEGIN
    -- Check if new columns exist
    SELECT COUNT(*)
    INTO column_count
    FROM information_schema.columns
    WHERE table_name = 'feedbacks'
    AND column_name IN ('author_name', 'author_email', 'rating', 'images', 'is_anonymous');
    
    IF column_count = 5 THEN
        RAISE NOTICE 'SUCCESS: All new columns added to feedbacks table';
    ELSE
        RAISE NOTICE 'WARNING: Some columns may be missing from feedbacks table (found % out of 5)', column_count;
    END IF;
END $$;
