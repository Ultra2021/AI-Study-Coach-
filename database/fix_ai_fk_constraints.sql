-- ============================================================
-- Fix: Drop auth.users foreign key constraints on AI tables
-- Run this in Supabase SQL Editor to fix the 23503 FK error
-- ============================================================

-- Drop FK constraints so the backend can insert without FK checks
ALTER TABLE ai_chat_history DROP CONSTRAINT IF EXISTS ai_chat_history_user_id_fkey;
ALTER TABLE reminders        DROP CONSTRAINT IF EXISTS reminders_user_id_fkey;
ALTER TABLE alarms           DROP CONSTRAINT IF EXISTS alarms_user_id_fkey;
ALTER TABLE monitoring_logs  DROP CONSTRAINT IF EXISTS monitoring_logs_user_id_fkey;

-- Confirm (should return no rows if constraints are gone)
SELECT conname, conrelid::regclass
FROM pg_constraint
WHERE conname IN (
    'ai_chat_history_user_id_fkey',
    'reminders_user_id_fkey',
    'alarms_user_id_fkey',
    'monitoring_logs_user_id_fkey'
);
