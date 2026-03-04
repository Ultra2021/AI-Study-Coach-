-- Add study goal columns to study_groups table
-- This allows group creators to set weekly and monthly study hour goals

-- Add study goal columns to study_groups table
ALTER TABLE study_groups 
ADD COLUMN IF NOT EXISTS weekly_study_goal INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS monthly_study_goal INTEGER DEFAULT NULL;

-- Add study_group_id to study_sessions if not exists
-- This links study sessions to specific study groups
ALTER TABLE study_sessions
ADD COLUMN IF NOT EXISTS study_group_id UUID REFERENCES study_groups(id) ON DELETE SET NULL;

-- Add notes column to study_sessions if not exists
ALTER TABLE study_sessions
ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT NULL;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_study_sessions_group ON study_sessions(study_group_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_created_at ON study_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_group ON study_sessions(user_id, study_group_id);

-- Add comments to document the schema
COMMENT ON COLUMN study_groups.weekly_study_goal IS 'Weekly study hour goal for the group (in hours)';
COMMENT ON COLUMN study_groups.monthly_study_goal IS 'Monthly study hour goal for the group (in hours)';
COMMENT ON COLUMN study_sessions.study_group_id IS 'Reference to study group if session was part of group study';
COMMENT ON COLUMN study_sessions.notes IS 'Optional notes about the study session';
