-- ===================================================
-- SUPABASE MANUAL MIGRATION SCRIPT - PART 2
-- Copy and paste this into Supabase SQL Editor AFTER Part 1
-- ===================================================

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
-- STEP 5: CREATE NEW TABLES
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
    uploaded_by UUID,
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
    user_id UUID,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    referrer TEXT,
    metadata JSON,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================
-- STEP 6: CREATE INDEXES FOR NEW TABLES
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
