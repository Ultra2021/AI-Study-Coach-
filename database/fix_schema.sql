-- Run this in Supabase SQL Editor to fix any missing schema components
-- Only run sections that are needed based on verify_schema.sql results

-- ========================================
-- STEP 1: Ensure UUID extension is enabled
-- ========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- STEP 2: Add missing columns if they don't exist
-- ========================================

-- Add user_id to study_sessions (required for multi-user)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='study_sessions' AND column_name='user_id'
    ) THEN
        ALTER TABLE study_sessions ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE SET NULL;
        CREATE INDEX idx_study_sessions_user_id ON study_sessions(user_id);
        RAISE NOTICE 'Added user_id column to study_sessions';
    ELSE
        RAISE NOTICE 'user_id column already exists in study_sessions';
    END IF;
END $$;

-- Add password_hash to users (required for authentication)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='users' AND column_name='password_hash'
    ) THEN
        ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NOT NULL DEFAULT '';
        RAISE NOTICE 'Added password_hash column to users';
    ELSE
        RAISE NOTICE 'password_hash column already exists in users';
    END IF;
END $$;

-- Add notes to study_sessions (optional but useful)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='study_sessions' AND column_name='notes'
    ) THEN
        ALTER TABLE study_sessions ADD COLUMN notes TEXT;
        RAISE NOTICE 'Added notes column to study_sessions';
    ELSE
        RAISE NOTICE 'notes column already exists in study_sessions';
    END IF;
END $$;

-- ========================================
-- STEP 3: Ensure critical indexes exist
-- ========================================

-- Study sessions indexes
CREATE INDEX IF NOT EXISTS idx_study_sessions_timestamp ON study_sessions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_study_sessions_subject ON study_sessions(subject);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON study_sessions(user_id);

-- Study groups indexes
CREATE INDEX IF NOT EXISTS idx_study_groups_creator ON study_groups(creator_id);
CREATE INDEX IF NOT EXISTS idx_study_groups_created_at ON study_groups(created_at DESC);

-- Study group members indexes
CREATE INDEX IF NOT EXISTS idx_group_members_group ON study_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON study_group_members(user_id);

-- Study group tags indexes
CREATE INDEX IF NOT EXISTS idx_group_tags_group ON study_group_tags(group_id);

-- Tasks indexes
CREATE INDEX IF NOT EXISTS idx_tasks_group ON study_group_tasks(group_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON study_group_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON study_group_tasks(status);

-- Files indexes
CREATE INDEX IF NOT EXISTS idx_files_group ON study_group_files(group_id);
CREATE INDEX IF NOT EXISTS idx_files_uploaded_by ON study_group_files(uploaded_by);

-- Notes indexes
CREATE INDEX IF NOT EXISTS idx_notes_group ON study_group_notes(group_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_by ON study_group_notes(created_by);

-- Activities indexes
CREATE INDEX IF NOT EXISTS idx_activities_group ON study_group_activities(group_id);
CREATE INDEX IF NOT EXISTS idx_activities_user ON study_group_activities(user_id);

-- ========================================
-- STEP 4: Ensure RLS is enabled
-- ========================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_group_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_group_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_group_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_group_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_group_activities ENABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 5: Create/Update RLS Policies (Development Mode)
-- ========================================

-- Users policies
DROP POLICY IF EXISTS "Allow all operations on users for now" ON users;
CREATE POLICY "Allow all operations on users for now" ON users
    FOR ALL USING (true);

-- Study sessions policies
DROP POLICY IF EXISTS "Allow all operations on study_sessions for now" ON study_sessions;
CREATE POLICY "Allow all operations on study_sessions for now" ON study_sessions
    FOR ALL USING (true);

-- Study groups policies
DROP POLICY IF EXISTS "Allow all operations on study_groups" ON study_groups;
CREATE POLICY "Allow all operations on study_groups" ON study_groups
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations on study_group_members" ON study_group_members;
CREATE POLICY "Allow all operations on study_group_members" ON study_group_members
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations on study_group_tags" ON study_group_tags;
CREATE POLICY "Allow all operations on study_group_tags" ON study_group_tags
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations on tasks" ON study_group_tasks;
CREATE POLICY "Allow all operations on tasks" ON study_group_tasks
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations on files" ON study_group_files;
CREATE POLICY "Allow all operations on files" ON study_group_files
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations on notes" ON study_group_notes;
CREATE POLICY "Allow all operations on notes" ON study_group_notes
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations on activities" ON study_group_activities;
CREATE POLICY "Allow all operations on activities" ON study_group_activities
    FOR ALL USING (true);

-- ========================================
-- STEP 6: Create/Update Triggers
-- ========================================

-- Ensure update_updated_at_column function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Study sessions trigger
DROP TRIGGER IF EXISTS update_study_sessions_updated_at ON study_sessions;
CREATE TRIGGER update_study_sessions_updated_at
    BEFORE UPDATE ON study_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Study groups trigger
DROP TRIGGER IF EXISTS update_study_groups_updated_at ON study_groups;
CREATE TRIGGER update_study_groups_updated_at
    BEFORE UPDATE ON study_groups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Tasks trigger
DROP TRIGGER IF EXISTS update_tasks_updated_at ON study_group_tasks;
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON study_group_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Files trigger
DROP TRIGGER IF EXISTS update_files_updated_at ON study_group_files;
CREATE TRIGGER update_files_updated_at
    BEFORE UPDATE ON study_group_files
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Notes trigger
DROP TRIGGER IF EXISTS update_notes_updated_at ON study_group_notes;
CREATE TRIGGER update_notes_updated_at
    BEFORE UPDATE ON study_group_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- STEP 7: Create function to auto-add creator as member
-- ========================================

CREATE OR REPLACE FUNCTION add_creator_as_member()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO study_group_members (group_id, user_id, role)
    VALUES (NEW.id, NEW.creator_id, 'creator')
    ON CONFLICT (group_id, user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS add_creator_to_group ON study_groups;
CREATE TRIGGER add_creator_to_group
    AFTER INSERT ON study_groups
    FOR EACH ROW
    EXECUTE FUNCTION add_creator_as_member();

-- ========================================
-- STEP 8: Create activity logging triggers
-- ========================================

-- Log task creation
CREATE OR REPLACE FUNCTION log_task_created()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO study_group_activities (group_id, user_id, activity_type, description, metadata)
    VALUES (
        NEW.group_id,
        NEW.created_by,
        'task_created',
        'Created task: ' || NEW.title,
        jsonb_build_object('task_id', NEW.id, 'task_title', NEW.title)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS task_created_activity ON study_group_tasks;
CREATE TRIGGER task_created_activity
    AFTER INSERT ON study_group_tasks
    FOR EACH ROW
    EXECUTE FUNCTION log_task_created();

-- Log file upload
CREATE OR REPLACE FUNCTION log_file_uploaded()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO study_group_activities (group_id, user_id, activity_type, description, metadata)
    VALUES (
        NEW.group_id,
        NEW.uploaded_by,
        'file_uploaded',
        'Uploaded file: ' || NEW.file_name,
        jsonb_build_object('file_id', NEW.id, 'file_name', NEW.file_name)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS file_uploaded_activity ON study_group_files;
CREATE TRIGGER file_uploaded_activity
    AFTER INSERT ON study_group_files
    FOR EACH ROW
    EXECUTE FUNCTION log_file_uploaded();

-- Log note creation
CREATE OR REPLACE FUNCTION log_note_created()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO study_group_activities (group_id, user_id, activity_type, description, metadata)
    VALUES (
        NEW.group_id,
        NEW.created_by,
        'note_added',
        'Added note: ' || NEW.title,
        jsonb_build_object('note_id', NEW.id, 'note_title', NEW.title)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS note_created_activity ON study_group_notes;
CREATE TRIGGER note_created_activity
    AFTER INSERT ON study_group_notes
    FOR EACH ROW
    EXECUTE FUNCTION log_note_created();

-- ========================================
-- DONE!
-- ========================================
SELECT 'Schema fix completed successfully!' as status;
