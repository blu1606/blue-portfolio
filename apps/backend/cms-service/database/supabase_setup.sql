-- ===================================================
-- SUPABASE SETUP SCRIPT
-- Quick setup for new Supabase projects
-- ===================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 3. Run the main schema file
-- Execute: enhanced_schema.sql

-- 4. Run the migration file (if updating existing database)
-- Execute: migration_v2.sql

-- ===================================================
-- SUPABASE SPECIFIC CONFIGURATIONS
-- ===================================================

-- Grant permissions for authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant permissions for anonymous users (for public endpoints)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON posts TO anon;
GRANT SELECT ON approved_feedbacks TO anon;
GRANT INSERT ON feedbacks TO anon;
GRANT INSERT ON analytics TO anon;

-- ===================================================
-- REALTIME SUBSCRIPTIONS (Optional)
-- ===================================================

-- Enable realtime for specific tables
-- ALTER PUBLICATION supabase_realtime ADD TABLE posts;
-- ALTER PUBLICATION supabase_realtime ADD TABLE feedbacks;
-- ALTER PUBLICATION supabase_realtime ADD TABLE comments;
