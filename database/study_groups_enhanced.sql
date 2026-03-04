-- Enhanced Study Groups Features
-- Additional tables for Tasks, Files, and Notes functionality
-- Run this after add_study_groups.sql

-- ========================================
-- STUDY GROUP TASKS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS study_group_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'
    priority VARCHAR(10) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- STUDY GROUP FILES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS study_group_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50), -- 'pdf', 'doc', 'image', 'video', etc.
    file_size BIGINT, -- in bytes
    file_url TEXT NOT NULL, -- URL to the actual file (Supabase Storage or external)
    description TEXT,
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- STUDY GROUP NOTES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS study_group_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT FALSE,
    tags TEXT[], -- Array of tags
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- STUDY GROUP ACTIVITY LOG TABLE
-- ========================================
-- Track all activities within a study group
CREATE TABLE IF NOT EXISTS study_group_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL, -- 'task_created', 'file_uploaded', 'note_added', 'member_joined', etc.
    description TEXT NOT NULL,
    metadata JSONB, -- Additional data (e.g., task_id, file_id, etc.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================
-- Tasks indexes
CREATE INDEX IF NOT EXISTS idx_tasks_group ON study_group_tasks(group_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON study_group_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON study_group_tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON study_group_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON study_group_tasks(created_by);

-- Files indexes
CREATE INDEX IF NOT EXISTS idx_files_group ON study_group_files(group_id);
CREATE INDEX IF NOT EXISTS idx_files_uploaded_by ON study_group_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_files_type ON study_group_files(file_type);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON study_group_files(created_at DESC);

-- Notes indexes
CREATE INDEX IF NOT EXISTS idx_notes_group ON study_group_notes(group_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_by ON study_group_notes(created_by);
CREATE INDEX IF NOT EXISTS idx_notes_pinned ON study_group_notes(is_pinned);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON study_group_notes(created_at DESC);

-- Activities indexes
CREATE INDEX IF NOT EXISTS idx_activities_group ON study_group_activities(group_id);
CREATE INDEX IF NOT EXISTS idx_activities_user ON study_group_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON study_group_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON study_group_activities(created_at DESC);

-- ========================================
-- TRIGGERS FOR UPDATED_AT
-- ========================================
-- Tasks
DROP TRIGGER IF EXISTS update_tasks_updated_at ON study_group_tasks;
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON study_group_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Files
DROP TRIGGER IF EXISTS update_files_updated_at ON study_group_files;
CREATE TRIGGER update_files_updated_at
    BEFORE UPDATE ON study_group_files
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Notes
DROP TRIGGER IF EXISTS update_notes_updated_at ON study_group_notes;
CREATE TRIGGER update_notes_updated_at
    BEFORE UPDATE ON study_group_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- ROW LEVEL SECURITY
-- ========================================
ALTER TABLE study_group_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_group_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_group_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_group_activities ENABLE ROW LEVEL SECURITY;

-- Policies (allow all for development - restrict in production)
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
-- USEFUL VIEWS
-- ========================================

-- View: Group tasks with assignee details
CREATE OR REPLACE VIEW study_group_tasks_detailed AS
SELECT 
    t.id,
    t.group_id,
    sg.name as group_name,
    t.title,
    t.description,
    t.status,
    t.priority,
    t.due_date,
    t.completed_at,
    u_assigned.username as assigned_to_name,
    u_assigned.email as assigned_to_email,
    u_creator.username as created_by_name,
    t.created_at,
    t.updated_at
FROM study_group_tasks t
LEFT JOIN study_groups sg ON t.group_id = sg.id
LEFT JOIN users u_assigned ON t.assigned_to = u_assigned.id
LEFT JOIN users u_creator ON t.created_by = u_creator.id;

-- View: Group files with uploader details
CREATE OR REPLACE VIEW study_group_files_detailed AS
SELECT 
    f.id,
    f.group_id,
    sg.name as group_name,
    f.file_name,
    f.file_type,
    f.file_size,
    f.file_url,
    f.description,
    f.download_count,
    u.username as uploaded_by_name,
    u.email as uploaded_by_email,
    f.created_at,
    f.updated_at
FROM study_group_files f
LEFT JOIN study_groups sg ON f.group_id = sg.id
LEFT JOIN users u ON f.uploaded_by = u.id;

-- View: Group notes with author details
CREATE OR REPLACE VIEW study_group_notes_detailed AS
SELECT 
    n.id,
    n.group_id,
    sg.name as group_name,
    n.title,
    n.content,
    n.is_pinned,
    n.tags,
    u.username as created_by_name,
    u.email as created_by_email,
    n.created_at,
    n.updated_at
FROM study_group_notes n
LEFT JOIN study_groups sg ON n.group_id = sg.id
LEFT JOIN users u ON n.created_by = u.id;

-- View: Recent group activities
CREATE OR REPLACE VIEW study_group_recent_activities AS
SELECT 
    a.id,
    a.group_id,
    sg.name as group_name,
    a.user_id,
    u.username,
    u.email,
    a.activity_type,
    a.description,
    a.metadata,
    a.created_at
FROM study_group_activities a
LEFT JOIN study_groups sg ON a.group_id = sg.id
LEFT JOIN users u ON a.user_id = u.id
ORDER BY a.created_at DESC;

-- ========================================
-- FUNCTIONS FOR ACTIVITY LOGGING
-- ========================================

-- Function to log task creation
CREATE OR REPLACE FUNCTION log_task_created()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO study_group_activities (group_id, user_id, activity_type, description, metadata)
    VALUES (
        NEW.group_id,
        NEW.created_by,
        'task_created',
        'Created task: ' || NEW.title,
        jsonb_build_object('task_id', NEW.id, 'task_title', NEW.title, 'priority', NEW.priority)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS task_created_activity ON study_group_tasks;
CREATE TRIGGER task_created_activity
    AFTER INSERT ON study_group_tasks
    FOR EACH ROW
    EXECUTE FUNCTION log_task_created();

-- Function to log file upload
CREATE OR REPLACE FUNCTION log_file_uploaded()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO study_group_activities (group_id, user_id, activity_type, description, metadata)
    VALUES (
        NEW.group_id,
        NEW.uploaded_by,
        'file_uploaded',
        'Uploaded file: ' || NEW.file_name,
        jsonb_build_object('file_id', NEW.id, 'file_name', NEW.file_name, 'file_type', NEW.file_type)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS file_uploaded_activity ON study_group_files;
CREATE TRIGGER file_uploaded_activity
    AFTER INSERT ON study_group_files
    FOR EACH ROW
    EXECUTE FUNCTION log_file_uploaded();

-- Function to log note creation
CREATE OR REPLACE FUNCTION log_note_created()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO study_group_activities (group_id, user_id, activity_type, description, metadata)
    VALUES (
        NEW.group_id,
        NEW.created_by,
        'note_added',
        'Added note: ' || NEW.title,
        jsonb_build_object('note_id', NEW.id, 'note_title', NEW.title, 'is_pinned', NEW.is_pinned)
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
-- COMMENTS
-- ========================================
COMMENT ON TABLE study_group_tasks IS 'Tasks and assignments within study groups';
COMMENT ON TABLE study_group_files IS 'Files shared within study groups';
COMMENT ON TABLE study_group_notes IS 'Collaborative notes for study groups';
COMMENT ON TABLE study_group_activities IS 'Activity log for all study group actions';

COMMENT ON VIEW study_group_tasks_detailed IS 'Tasks with full user and group details';
COMMENT ON VIEW study_group_files_detailed IS 'Files with uploader and group details';
COMMENT ON VIEW study_group_notes_detailed IS 'Notes with author and group details';
COMMENT ON VIEW study_group_recent_activities IS 'Recent activities across all groups';

-- ========================================
-- SAMPLE DATA (OPTIONAL FOR TESTING)
-- ========================================
-- Uncomment to insert sample data

/*
-- Sample task
INSERT INTO study_group_tasks (group_id, title, description, created_by, status, priority, due_date)
SELECT 
    id,
    'Complete Chapter 5 Review',
    'Review all concepts from Chapter 5 and prepare summary notes',
    creator_id,
    'pending',
    'high',
    CURRENT_TIMESTAMP + INTERVAL '7 days'
FROM study_groups LIMIT 1;

-- Sample note
INSERT INTO study_group_notes (group_id, created_by, title, content, is_pinned)
SELECT 
    id,
    creator_id,
    'Study Session Notes - Week 1',
    'Key concepts covered:\n1. Database normalization\n2. SQL joins\n3. Indexing strategies',
    TRUE
FROM study_groups LIMIT 1;
*/
