-- ===================================================
-- SUPABASE MANUAL MIGRATION SCRIPT
-- Copy and paste this into Supabase SQL Editor
-- ===================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create update timestamp function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ===================================================
-- STEP 1: ADD NEW COLUMNS TO FEEDBACKS TABLE
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
