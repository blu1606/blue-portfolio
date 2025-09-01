-- Database Query Optimization - Part 2
-- Migration: 002_optimize_existing_queries.sql  
-- Created: 2025-09-01
-- Purpose: Optimize existing table structures and add query-specific improvements

-- ===============================================
-- ANALYZE TABLE STATISTICS
-- ===============================================

-- Update table statistics for better query planning
ANALYZE posts;
ANALYZE comments;
ANALYZE feedbacks;
ANALYZE tags;
ANALYZE post_tags;

-- ===============================================
-- CONSTRAINT OPTIMIZATIONS
-- ===============================================

-- Add foreign key constraints with proper indexing if missing
DO $$ 
BEGIN
    -- Check and add foreign key for comments.post_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_comments_post_id'
    ) THEN
        ALTER TABLE comments 
        ADD CONSTRAINT fk_comments_post_id 
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE;
    END IF;

    -- Check and add foreign key for post_tags.post_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_post_tags_post_id'
    ) THEN
        ALTER TABLE post_tags 
        ADD CONSTRAINT fk_post_tags_post_id 
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE;
    END IF;

    -- Check and add foreign key for post_tags.tag_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_post_tags_tag_id'
    ) THEN
        ALTER TABLE post_tags 
        ADD CONSTRAINT fk_post_tags_tag_id 
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ===============================================
-- PARTIAL INDEX OPTIMIZATIONS
-- ===============================================

-- More specific indexes for common filter combinations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_published_recent 
ON posts(created_at DESC) 
WHERE is_published = true AND deleted_at IS NULL;

-- Index for draft posts (admin interface)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_drafts 
ON posts(updated_at DESC) 
WHERE is_published = false AND deleted_at IS NULL;

-- Index for popular published posts
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_popular_published 
ON posts(views_count DESC, created_at DESC) 
WHERE is_published = true AND deleted_at IS NULL AND views_count > 0;

-- ===============================================
-- PAGINATION OPTIMIZATION INDEXES
-- ===============================================

-- Cursor-based pagination support for posts
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_cursor_pagination 
ON posts(created_at, id) 
WHERE deleted_at IS NULL;

-- Cursor-based pagination for comments
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_cursor_pagination 
ON comments(post_id, created_at, id) 
WHERE deleted_at IS NULL;

-- ===============================================
-- SEARCH OPTIMIZATION
-- ===============================================

-- Add trigram extension for fuzzy string matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Trigram index for post title fuzzy search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_title_trgm 
ON posts USING gin(title gin_trgm_ops)
WHERE deleted_at IS NULL;

-- Trigram index for tag name fuzzy search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tags_name_trgm 
ON tags USING gin(name gin_trgm_ops)
WHERE is_active = true;

-- ===============================================
-- MATERIALIZED VIEW FOR ANALYTICS
-- ===============================================

-- Create materialized view for post statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS post_stats AS
SELECT 
    p.id,
    p.slug,
    p.title,
    p.created_at,
    p.views_count,
    COUNT(DISTINCT c.id) as comment_count,
    COUNT(DISTINCT pt.tag_id) as tag_count,
    p.is_published
FROM posts p
LEFT JOIN comments c ON p.id = c.post_id AND c.deleted_at IS NULL
LEFT JOIN post_tags pt ON p.id = pt.post_id
WHERE p.deleted_at IS NULL
GROUP BY p.id, p.slug, p.title, p.created_at, p.views_count, p.is_published;

-- Index on materialized view
CREATE INDEX IF NOT EXISTS idx_post_stats_views 
ON post_stats(views_count DESC);

CREATE INDEX IF NOT EXISTS idx_post_stats_comments 
ON post_stats(comment_count DESC);

CREATE INDEX IF NOT EXISTS idx_post_stats_published 
ON post_stats(is_published, created_at DESC);

-- ===============================================
-- PERFORMANCE MONITORING VIEWS
-- ===============================================

-- View for slow queries monitoring
CREATE OR REPLACE VIEW slow_queries AS
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements 
WHERE mean_time > 100  -- queries taking more than 100ms on average
ORDER BY mean_time DESC;

-- View for index effectiveness
CREATE OR REPLACE VIEW index_effectiveness AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    CASE 
        WHEN idx_tup_read = 0 THEN 0
        ELSE (idx_tup_fetch::float / idx_tup_read::float * 100)::numeric(5,2)
    END AS selectivity_percent
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY selectivity_percent DESC;

-- ===============================================
-- QUERY HINTS FOR COMMON PATTERNS
-- ===============================================

-- Function to get posts with optimized query structure
CREATE OR REPLACE FUNCTION get_posts_optimized(
    p_limit INTEGER DEFAULT 10,
    p_offset INTEGER DEFAULT 0,
    p_published_only BOOLEAN DEFAULT true
)
RETURNS TABLE(
    id INTEGER,
    title VARCHAR,
    slug VARCHAR,
    excerpt TEXT,
    created_at TIMESTAMPTZ,
    views_count INTEGER,
    comment_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.slug,
        p.excerpt,
        p.created_at,
        p.views_count,
        COALESCE(ps.comment_count, 0) as comment_count
    FROM posts p
    LEFT JOIN post_stats ps ON p.id = ps.id
    WHERE p.deleted_at IS NULL
        AND (NOT p_published_only OR p.is_published = true)
    ORDER BY p.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Function for efficient post search
CREATE OR REPLACE FUNCTION search_posts_optimized(
    p_search_term TEXT,
    p_limit INTEGER DEFAULT 10,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
    id INTEGER,
    title VARCHAR,
    slug VARCHAR,
    excerpt TEXT,
    created_at TIMESTAMPTZ,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.slug,
        p.excerpt,
        p.created_at,
        ts_rank(p.search_vector, plainto_tsquery('english', p_search_term)) as rank
    FROM posts p
    WHERE p.deleted_at IS NULL 
        AND p.is_published = true
        AND p.search_vector @@ plainto_tsquery('english', p_search_term)
    ORDER BY rank DESC, p.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- MAINTENANCE PROCEDURES
-- ===============================================

-- Procedure to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY post_stats;
    -- Add other materialized views here as they're created
END;
$$ LANGUAGE plpgsql;

-- Procedure to update table statistics
CREATE OR REPLACE FUNCTION update_table_statistics()
RETURNS void AS $$
BEGIN
    ANALYZE posts;
    ANALYZE comments;
    ANALYZE feedbacks;
    ANALYZE tags;
    ANALYZE post_tags;
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- CLEANUP UNUSED INDEXES
-- ===============================================

-- Query to identify unused indexes (run manually to review)
/*
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as size
FROM pg_stat_user_indexes 
WHERE idx_scan < 10  -- indexes used less than 10 times
    AND schemaname = 'public'
    AND indexname NOT LIKE '%_pkey'  -- exclude primary keys
ORDER BY pg_relation_size(indexname::regclass) DESC;
*/

-- ===============================================
-- VERIFICATION AND MONITORING
-- ===============================================

-- Verify query performance improvements
SELECT 'Migration 002 completed successfully. Run EXPLAIN ANALYZE on your queries to verify performance improvements.' as status;
