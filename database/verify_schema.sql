-- Run this in Supabase SQL Editor to verify your schema is correct
-- This will check for required columns, indexes, and constraints

-- ========================================
-- 1. Check if all required columns exist
-- ========================================

-- Check users table columns
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Check study_sessions table columns
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'study_sessions' 
ORDER BY ordinal_position;

-- ========================================
-- 2. Verify study_sessions has user_id column
-- ========================================
-- This is required for multi-user support
SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='study_sessions' AND column_name='user_id'
) AS has_user_id_column;

-- ========================================
-- 3. Verify users table has password_hash column
-- ========================================
SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='users' AND column_name='password_hash'
) AS has_password_hash_column;

-- ========================================
-- 4. Check UNIQUE constraints on study_group_members
-- ========================================
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'study_group_members' AND constraint_type = 'UNIQUE';

-- ========================================
-- 5. Check if triggers exist
-- ========================================
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_table IN ('study_groups', 'study_group_tasks', 'study_group_files', 'study_group_notes')
ORDER BY event_object_table, trigger_name;

-- ========================================
-- 6. Check Row Level Security is enabled
-- ========================================
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('users', 'study_sessions', 'study_groups', 'study_group_members', 
                    'study_group_tasks', 'study_group_files', 'study_group_notes', 'study_group_activities')
ORDER BY tablename;

-- ========================================
-- 7. Check indexes for performance
-- ========================================
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('study_sessions', 'study_groups', 'study_group_members', 'study_group_tasks')
ORDER BY tablename, indexname;

-- ========================================
-- 8. Count records to verify data
-- ========================================
SELECT 
    'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'study_sessions', COUNT(*) FROM study_sessions
UNION ALL
SELECT 'study_groups', COUNT(*) FROM study_groups
UNION ALL
SELECT 'study_group_members', COUNT(*) FROM study_group_members
UNION ALL
SELECT 'study_group_tags', COUNT(*) FROM study_group_tags
UNION ALL
SELECT 'study_group_tasks', COUNT(*) FROM study_group_tasks
UNION ALL
SELECT 'study_group_files', COUNT(*) FROM study_group_files
UNION ALL
SELECT 'study_group_notes', COUNT(*) FROM study_group_notes
UNION ALL
SELECT 'study_group_activities', COUNT(*) FROM study_group_activities;
