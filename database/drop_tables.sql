-- Drop Tables Script
-- Run this FIRST in Supabase SQL Editor to remove old tables
-- WARNING: This will delete all existing data!

-- Drop views first (they depend on tables)
DROP VIEW IF EXISTS user_progress_overview;
DROP VIEW IF EXISTS study_statistics;

-- Drop tables in reverse order of dependencies
DROP TABLE IF EXISTS ai_insights CASCADE;
DROP TABLE IF EXISTS progress_tracking CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS goals CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS study_sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop the trigger function if it exists
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Confirmation message
SELECT 'All tables dropped successfully. Now run schema.sql to create the new tables.' as message;
