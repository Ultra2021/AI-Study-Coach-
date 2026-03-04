-- ============================================================
-- AI Features SQL Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. AI Chat History Table
CREATE TABLE IF NOT EXISTS ai_chat_history (
    id           BIGSERIAL PRIMARY KEY,
    user_id      UUID NOT NULL,
    user_message TEXT NOT NULL,
    ai_response  TEXT NOT NULL,
    context_type TEXT DEFAULT 'general',
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_chat_history_user ON ai_chat_history(user_id, created_at DESC);

-- 2. Reminders Table
CREATE TABLE IF NOT EXISTS reminders (
    id           BIGSERIAL PRIMARY KEY,
    user_id      UUID NOT NULL,
    title        TEXT NOT NULL,
    description  TEXT,
    due_date     TIMESTAMPTZ,
    is_done      BOOLEAN DEFAULT FALSE,
    recurrence   TEXT DEFAULT 'none' CHECK (recurrence IN ('none','daily','weekly','monthly')),
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reminders_user ON reminders(user_id, due_date);

-- 3. Alarms Table
CREATE TABLE IF NOT EXISTS alarms (
    id          BIGSERIAL PRIMARY KEY,
    user_id     UUID NOT NULL,
    label       TEXT NOT NULL,
    alarm_time  TIMESTAMPTZ NOT NULL,
    repeat_days TEXT,                  -- comma-separated: "Mon,Wed,Fri" or NULL for once
    is_active   BOOLEAN DEFAULT TRUE,
    is_fired    BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alarms_user ON alarms(user_id, is_active);

-- 4. Monitoring / App Event Logs Table
CREATE TABLE IF NOT EXISTS monitoring_logs (
    id          BIGSERIAL PRIMARY KEY,
    user_id     UUID,
    event_type  TEXT NOT NULL,
    endpoint    TEXT,
    status_code INTEGER,
    duration_ms INTEGER,
    error_msg   TEXT,
    metadata    JSONB DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_monitoring_logs_created ON monitoring_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_monitoring_logs_user    ON monitoring_logs(user_id, created_at DESC);

-- Row Level Security (RLS) - users only see their own data
ALTER TABLE ai_chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders        ENABLE ROW LEVEL SECURITY;
ALTER TABLE alarms           ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_logs  ENABLE ROW LEVEL SECURITY;

-- RLS Policies (DROP first to avoid duplicate errors on re-runs)
DROP POLICY IF EXISTS "chat_history_user_policy" ON ai_chat_history;
CREATE POLICY "chat_history_user_policy" ON ai_chat_history
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "reminders_user_policy" ON reminders;
CREATE POLICY "reminders_user_policy" ON reminders
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "alarms_user_policy" ON alarms;
CREATE POLICY "alarms_user_policy" ON alarms
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "monitoring_logs_user_policy" ON monitoring_logs;
CREATE POLICY "monitoring_logs_user_policy" ON monitoring_logs
    FOR ALL USING (auth.uid() = user_id);
