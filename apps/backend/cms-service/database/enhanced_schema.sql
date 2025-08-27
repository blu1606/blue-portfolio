-- ===================================================
-- Enhanced Database Schema for CMS Service
-- Compatible with Supabase PostgreSQL
-- Date: August 27, 2025
-- ===================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===================================================
-- USERS TABLE (Reference - may already exist in auth service)
-- ===================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE,
    full_name VARCHAR(255),
    avatar_url TEXT,
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================
-- POSTS TABLE
-- ===================================================
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(600) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    featured_image_url TEXT,
    images JSON, -- Array of image URLs
    tags JSON, -- Array of tags
    category VARCHAR(100),
    status VARCHAR(50) DEFAULT 'draft', -- draft, published, archived
    meta_title VARCHAR(600),
    meta_description TEXT,
    is_featured BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================
-- ENHANCED FEEDBACKS TABLE
-- ===================================================
CREATE TABLE IF NOT EXISTS feedbacks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- User information (for both authenticated and anonymous users)
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL for anonymous feedback
    author_name VARCHAR(100), -- Required for anonymous feedback
    author_email VARCHAR(254), -- Optional for anonymous feedback
    author_avatar_url TEXT, -- Uploaded avatar image URL
    
    -- Content
    content TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5), -- 1-5 star rating
    
    -- Images
    images JSON, -- Array of image URLs ["url1", "url2", ...]
    
    -- Metadata
    is_approved BOOLEAN DEFAULT false,
    is_anonymous BOOLEAN DEFAULT false,
    ip_address INET, -- For spam protection and rate limiting
    user_agent TEXT, -- For analytics and security
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Constraints
    CONSTRAINT feedback_user_or_anonymous CHECK (
        (is_anonymous = true AND author_name IS NOT NULL) OR 
        (is_anonymous = false AND user_id IS NOT NULL)
    )
);

-- ===================================================
-- COMMENTS TABLE
-- ===================================================
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    
    -- User information (similar to feedbacks)
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    author_name VARCHAR(100), -- For anonymous comments
    author_email VARCHAR(254), -- Optional for anonymous comments
    author_avatar_url TEXT,
    
    -- Content
    content TEXT NOT NULL,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- For nested comments
    
    -- Metadata
    is_approved BOOLEAN DEFAULT false,
    is_anonymous BOOLEAN DEFAULT false,
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Constraints
    CONSTRAINT comment_user_or_anonymous CHECK (
        (is_anonymous = true AND author_name IS NOT NULL) OR 
        (is_anonymous = false AND user_id IS NOT NULL)
    )
);

-- ===================================================
-- MEDIA TABLE (for tracking uploaded files)
-- ===================================================
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

-- ===================================================
-- ANALYTICS TABLE (for tracking feedback and engagement)
-- ===================================================
CREATE TABLE IF NOT EXISTS analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL, -- 'feedback_submitted', 'post_viewed', etc.
    entity_type VARCHAR(50), -- 'post', 'feedback', 'comment'
    entity_id UUID,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    referrer TEXT,
    metadata JSON, -- Additional event data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================
-- INDEXES for Performance
-- ===================================================

-- Posts indexes
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_is_featured ON posts(is_featured);

-- Feedbacks indexes
CREATE INDEX IF NOT EXISTS idx_feedbacks_user_id ON feedbacks(user_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_is_approved ON feedbacks(is_approved);
CREATE INDEX IF NOT EXISTS idx_feedbacks_is_anonymous ON feedbacks(is_anonymous);
CREATE INDEX IF NOT EXISTS idx_feedbacks_created_at ON feedbacks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedbacks_ip_address ON feedbacks(ip_address);
CREATE INDEX IF NOT EXISTS idx_feedbacks_rating ON feedbacks(rating);

-- Comments indexes
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_is_approved ON comments(is_approved);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

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
-- TRIGGERS for auto-updating timestamps
-- ===================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables
CREATE TRIGGER update_posts_updated_at 
    BEFORE UPDATE ON posts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feedbacks_updated_at 
    BEFORE UPDATE ON feedbacks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at 
    BEFORE UPDATE ON comments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_media_updated_at 
    BEFORE UPDATE ON media 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================================================
-- ROW LEVEL SECURITY (RLS) Policies for Supabase
-- ===================================================

-- Enable RLS on tables
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;

-- Posts policies
CREATE POLICY "Posts are viewable by everyone" ON posts
    FOR SELECT USING (status = 'published');

CREATE POLICY "Users can insert their own posts" ON posts
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own posts" ON posts
    FOR UPDATE USING (auth.uid() = author_id);

-- Feedbacks policies
CREATE POLICY "Approved feedbacks are viewable by everyone" ON feedbacks
    FOR SELECT USING (is_approved = true);

CREATE POLICY "Anyone can insert feedback" ON feedbacks
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own feedbacks" ON feedbacks
    FOR SELECT USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Approved comments are viewable by everyone" ON comments
    FOR SELECT USING (is_approved = true);

CREATE POLICY "Anyone can insert comments" ON comments
    FOR INSERT WITH CHECK (true);

-- Media policies
CREATE POLICY "Media is viewable by everyone" ON media
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own media" ON media
    FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

-- ===================================================
-- VIEWS for Common Queries
-- ===================================================

-- View for approved feedbacks with user info
CREATE OR REPLACE VIEW approved_feedbacks AS
SELECT 
    f.id,
    f.content,
    f.rating,
    f.images,
    f.is_anonymous,
    f.created_at,
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

-- View for published posts with author info
CREATE OR REPLACE VIEW published_posts AS
SELECT 
    p.id,
    p.title,
    p.slug,
    p.content,
    p.excerpt,
    p.featured_image_url,
    p.images,
    p.tags,
    p.category,
    p.meta_title,
    p.meta_description,
    p.is_featured,
    p.view_count,
    p.published_at,
    p.created_at,
    u.full_name as author_name,
    u.avatar_url as author_avatar_url
FROM posts p
LEFT JOIN users u ON p.author_id = u.id
WHERE p.status = 'published'
ORDER BY p.published_at DESC;

-- ===================================================
-- FUNCTIONS for Business Logic
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
-- SAMPLE DATA (Optional - for testing)
-- ===================================================

-- Insert sample user (if users table exists)
-- INSERT INTO users (id, email, username, full_name, role) VALUES
-- ('550e8400-e29b-41d4-a716-446655440000', 'admin@example.com', 'admin', 'Admin User', 'admin')
-- ON CONFLICT (email) DO NOTHING;

-- ===================================================
-- MIGRATION NOTES
-- ===================================================

/*
To migrate existing feedback data, run:

-- Add new columns to existing feedbacks table
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS author_name VARCHAR(100);
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS author_email VARCHAR(254);
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS author_avatar_url TEXT;
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5);
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS images JSON;
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false;
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS ip_address INET;
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Update existing feedbacks to mark as authenticated (not anonymous)
UPDATE feedbacks SET is_anonymous = false WHERE user_id IS NOT NULL;
UPDATE feedbacks SET is_anonymous = true WHERE user_id IS NULL;

-- Add constraint after data migration
ALTER TABLE feedbacks ADD CONSTRAINT feedback_user_or_anonymous CHECK (
    (is_anonymous = true AND author_name IS NOT NULL) OR 
    (is_anonymous = false AND user_id IS NOT NULL)
);
*/
