-- ===================================================
-- MIGRATION SCRIPT: Update Existing Database
-- Compatible with Supabase PostgreSQL
-- Date: August 27, 2025
-- Version: 1.0 -> 2.0 (Enhanced Feedback System)
-- ===================================================

-- ===================================================
-- STEP 1: ADD NEW COLUMNS TO EXISTING TABLES
-- ===================================================

-- Add new columns to feedbacks table
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS author_name VARCHAR(100);
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS author_email VARCHAR(254);
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS author_avatar_url TEXT;
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS rating INTEGER;
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS images JSON;
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false;
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS ip_address INET;
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS approved_by UUID;

-- Add rating constraint
ALTER TABLE feedbacks ADD CONSTRAINT IF NOT EXISTS feedbacks_rating_check 
    CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5));

-- Add foreign key for approved_by
ALTER TABLE feedbacks ADD CONSTRAINT IF NOT EXISTS feedbacks_approved_by_fkey 
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL;

-- ===================================================
-- STEP 2: UPDATE EXISTING DATA
-- ===================================================

-- Mark existing feedbacks as authenticated (not anonymous)
UPDATE feedbacks 
SET is_anonymous = false 
WHERE user_id IS NOT NULL AND is_anonymous IS NULL;

-- Mark existing feedbacks without user_id as needing manual review
UPDATE feedbacks 
SET is_anonymous = true,
    author_name = 'Legacy User'
WHERE user_id IS NULL AND is_anonymous IS NULL;

-- Set approved_at for already approved feedbacks
UPDATE feedbacks 
SET approved_at = updated_at 
WHERE is_approved = true AND approved_at IS NULL;

-- ===================================================
-- STEP 3: ADD CONSTRAINTS AFTER DATA MIGRATION
-- ===================================================

-- Add constraint to ensure either user_id or author_name is present
ALTER TABLE feedbacks ADD CONSTRAINT IF NOT EXISTS feedback_user_or_anonymous 
    CHECK (
        (is_anonymous = true AND author_name IS NOT NULL) OR 
        (is_anonymous = false AND user_id IS NOT NULL)
    );

-- ===================================================
-- STEP 4: CREATE NEW INDEXES
-- ===================================================

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_feedbacks_rating ON feedbacks(rating);
CREATE INDEX IF NOT EXISTS idx_feedbacks_is_anonymous ON feedbacks(is_anonymous);
CREATE INDEX IF NOT EXISTS idx_feedbacks_ip_address ON feedbacks(ip_address);
CREATE INDEX IF NOT EXISTS idx_feedbacks_approved_at ON feedbacks(approved_at DESC);

-- ===================================================
-- STEP 5: UPDATE TRIGGERS
-- ===================================================

-- Ensure updated_at trigger exists for feedbacks
CREATE TRIGGER IF NOT EXISTS update_feedbacks_updated_at 
    BEFORE UPDATE ON feedbacks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================================================
-- STEP 6: CREATE NEW TABLES (if not exist)
-- ===================================================

-- Media table for tracking uploaded files
CREATE TABLE IF NOT EXISTS media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(500) NOT NULL,
    original_name VARCHAR(500),
    mime_type VARCHAR(100),
    size_bytes BIGINT,
    url TEXT NOT NULL,
    cloudinary_public_id VARCHAR(500),
    alt_text TEXT,
    title VARCHAR(500),
    description TEXT,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    entity_type VARCHAR(50), -- 'post', 'feedback', 'comment', 'avatar', etc.
    entity_id UUID, -- Related entity ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics table for tracking
CREATE TABLE IF NOT EXISTS analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    referrer TEXT,
    metadata JSON,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================
-- STEP 7: CREATE INDEXES FOR NEW TABLES
-- ===================================================

-- Media indexes
CREATE INDEX IF NOT EXISTS idx_media_entity_type_id ON media(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_media_uploaded_by ON media(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_media_created_at ON media(created_at DESC);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_entity_type_id ON analytics(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_ip_address ON analytics(ip_address);

-- ===================================================
-- STEP 8: CREATE UTILITY FUNCTIONS
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
-- STEP 9: UPDATE VIEWS
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
        WHEN f.is_anonymous = false THEN u.full_name
        ELSE f.author_name
    END as author_name,
    CASE 
        WHEN f.is_anonymous = false THEN u.avatar_url
        ELSE f.author_avatar_url
    END as author_avatar_url,
    CASE 
        WHEN f.is_anonymous = false THEN u.email
        ELSE f.author_email
    END as author_email
FROM feedbacks f
LEFT JOIN users u ON f.user_id = u.id
WHERE f.is_approved = true
ORDER BY f.created_at DESC;

-- ===================================================
-- STEP 10: UPDATE ROW LEVEL SECURITY
-- ===================================================

-- Update RLS policies for feedbacks
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
        (is_anonymous = true AND ip_address = inet_client_addr())
    );

-- Enable RLS on new tables
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- Policies for media
CREATE POLICY "Media is viewable by everyone" ON media
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own media" ON media
    FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

-- ===================================================
-- VERIFICATION QUERIES
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
        RAISE NOTICE 'WARNING: Some columns may be missing from feedbacks table';
    END IF;
END $$;

-- ===================================================
-- ROLLBACK SCRIPT (if needed)
-- ===================================================

/*
-- To rollback this migration, run:

-- Remove new columns
ALTER TABLE feedbacks DROP COLUMN IF EXISTS author_name;
ALTER TABLE feedbacks DROP COLUMN IF EXISTS author_email;
ALTER TABLE feedbacks DROP COLUMN IF EXISTS author_avatar_url;
ALTER TABLE feedbacks DROP COLUMN IF EXISTS rating;
ALTER TABLE feedbacks DROP COLUMN IF EXISTS images;
ALTER TABLE feedbacks DROP COLUMN IF EXISTS is_anonymous;
ALTER TABLE feedbacks DROP COLUMN IF EXISTS ip_address;
ALTER TABLE feedbacks DROP COLUMN IF EXISTS user_agent;
ALTER TABLE feedbacks DROP COLUMN IF EXISTS approved_at;
ALTER TABLE feedbacks DROP COLUMN IF EXISTS approved_by;

-- Drop new tables
DROP TABLE IF EXISTS analytics;
DROP TABLE IF EXISTS media;

-- Drop functions
DROP FUNCTION IF EXISTS get_feedback_count_by_ip(INET, INTEGER);
DROP FUNCTION IF EXISTS check_duplicate_feedback_by_ip(INET, INTEGER);

-- Drop view
DROP VIEW IF EXISTS approved_feedbacks;
*/
