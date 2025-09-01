-- Database Performance Optimization - Index Creation
-- Migration: 001_add_performance_indexes.sql
-- Created: 2025-09-01
-- Purpose: Add indexes to improve query performance for CMS service

-- ===============================================
-- POSTS TABLE PERFORMANCE INDEXES
-- ===============================================

-- Index for slug-based lookups (most common query pattern)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_slug 
ON posts(slug) 
WHERE deleted_at IS NULL;

-- Composite index for author + published status filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_author_published 
ON posts(author_id, is_published) 
WHERE deleted_at IS NULL;

-- Composite index for deleted + published status (most common filter combination)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_deleted_published 
ON posts(deleted_at, is_published);

-- Index for default sorting by creation date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_created_at 
ON posts(created_at DESC) 
WHERE deleted_at IS NULL;

-- Index for sorting by popularity/views
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_views_count 
ON posts(views_count DESC) 
WHERE deleted_at IS NULL;

-- Composite index for published posts ordering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_published_created 
ON posts(is_published, created_at DESC) 
WHERE deleted_at IS NULL;

-- ===============================================
-- COMMENTS TABLE PERFORMANCE INDEXES  
-- ===============================================

-- Index for getting comments by post (most common query)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_post_id 
ON comments(post_id) 
WHERE deleted_at IS NULL;

-- Composite index for post + deleted status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_post_deleted 
ON comments(post_id, deleted_at);

-- Index for sorting comments by creation date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_created_at 
ON comments(created_at);

-- Composite index for post + user (for user's comments on post)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_post_user 
ON comments(post_id, user_id) 
WHERE deleted_at IS NULL;

-- ===============================================
-- FEEDBACKS TABLE PERFORMANCE INDEXES
-- ===============================================

-- Composite index for IP-based duplicate checking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_feedbacks_ip_created 
ON feedbacks(ip_address, created_at);

-- Index for filtering by feedback status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_feedbacks_status 
ON feedbacks(status);

-- Index for default sorting by creation date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_feedbacks_created_at 
ON feedbacks(created_at DESC);

-- Composite index for anonymous feedback filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_feedbacks_anonymous_status 
ON feedbacks(is_anonymous, status);

-- Index for user feedback lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_feedbacks_user_id 
ON feedbacks(user_id) 
WHERE user_id IS NOT NULL;

-- ===============================================
-- POST_TAGS JUNCTION TABLE INDEXES
-- ===============================================

-- Index for finding tags by post
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_tags_post_id 
ON post_tags(post_id);

-- Index for finding posts by tag
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_tags_tag_id 
ON post_tags(tag_id);

-- Composite unique index to prevent duplicate relationships
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_post_tags_unique 
ON post_tags(post_id, tag_id);

-- ===============================================
-- TAGS TABLE PERFORMANCE INDEXES
-- ===============================================

-- Index for tag slug lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tags_slug 
ON tags(slug);

-- Index for tag name searches
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tags_name 
ON tags(name);

-- Index for active tags
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tags_active 
ON tags(is_active) 
WHERE is_active = true;

-- ===============================================
-- FULL-TEXT SEARCH PREPARATION  
-- ===============================================

-- Add search vector column for posts (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'posts' AND column_name = 'search_vector'
    ) THEN
        ALTER TABLE posts ADD COLUMN search_vector tsvector;
    END IF;
END $$;

-- Create GIN index for full-text search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_search_vector 
ON posts USING gin(search_vector);

-- Create function to update search vector
CREATE OR REPLACE FUNCTION update_posts_search_vector()
RETURNS trigger AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', 
        COALESCE(NEW.title, '') || ' ' || 
        COALESCE(NEW.content, '') || ' ' ||
        COALESCE(NEW.excerpt, '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update search vector
DROP TRIGGER IF EXISTS update_posts_search_vector_trigger ON posts;
CREATE TRIGGER update_posts_search_vector_trigger
    BEFORE INSERT OR UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_posts_search_vector();

-- Update existing records with search vector
UPDATE posts SET search_vector = to_tsvector('english', 
    COALESCE(title, '') || ' ' || 
    COALESCE(content, '') || ' ' ||
    COALESCE(excerpt, '')
) WHERE search_vector IS NULL;

-- ===============================================
-- INDEX USAGE MONITORING FUNCTIONS
-- ===============================================

-- Function to get index usage statistics
CREATE OR REPLACE FUNCTION get_index_usage()
RETURNS TABLE(
    table_name text,
    index_name text,
    index_size text,
    index_scans bigint,
    tuples_read bigint,
    tuples_fetched bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname||'.'||tablename as table_name,
        indexname as index_name,
        pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
        idx_scan as index_scans,
        idx_tup_read as tuples_read,
        idx_tup_fetch as tuples_fetched
    FROM pg_stat_user_indexes 
    WHERE schemaname = 'public'
    ORDER BY idx_scan DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get table sizes
CREATE OR REPLACE FUNCTION get_table_sizes()
RETURNS TABLE(
    table_name text,
    table_size text,
    index_size text,
    total_size text,
    row_count bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname||'.'||tablename as table_name,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size,
        pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as index_size,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) + pg_indexes_size(schemaname||'.'||tablename)) as total_size,
        n_tup_ins + n_tup_upd as row_count
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- VERIFICATION QUERIES
-- ===============================================

-- Verify all indexes were created successfully
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Check index sizes
SELECT 
    indexname,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as size
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND indexname LIKE 'idx_%'
ORDER BY pg_relation_size(indexname::regclass) DESC;
