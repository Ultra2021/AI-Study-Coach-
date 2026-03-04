-- Add Study Groups feature to AI Study Coach
-- Run this to add study groups tables and relationships

-- Create study_groups table
CREATE TABLE IF NOT EXISTS study_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    location VARCHAR(100),
    total_hours INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create study_group_members table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS study_group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member', -- 'creator', 'admin', 'member'
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, user_id)
);

-- Create study_group_tags table (for categorizing groups)
CREATE TABLE IF NOT EXISTS study_group_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
    tag VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, tag)
);

-- Add password_hash to users table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='users' AND column_name='password_hash'
    ) THEN
        ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NOT NULL DEFAULT '';
    END IF;
END $$;

-- Add user_id to study_sessions if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='study_sessions' AND column_name='user_id'
    ) THEN
        ALTER TABLE study_sessions ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE SET NULL;
        CREATE INDEX idx_study_sessions_user_id ON study_sessions(user_id);
    END IF;
END $$;

-- Add notes column to study_sessions if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='study_sessions' AND column_name='notes'
    ) THEN
        ALTER TABLE study_sessions ADD COLUMN notes TEXT;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_study_groups_creator ON study_groups(creator_id);
CREATE INDEX IF NOT EXISTS idx_study_groups_created_at ON study_groups(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON study_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON study_group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_tags_group ON study_group_tags(group_id);

-- Create trigger for study_groups updated_at
DROP TRIGGER IF EXISTS update_study_groups_updated_at ON study_groups;
CREATE TRIGGER update_study_groups_updated_at
    BEFORE UPDATE ON study_groups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_group_tags ENABLE ROW LEVEL SECURITY;

-- Create policies for study_groups (allow all for development)
DROP POLICY IF EXISTS "Allow all operations on study_groups" ON study_groups;
CREATE POLICY "Allow all operations on study_groups" ON study_groups
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations on study_group_members" ON study_group_members;
CREATE POLICY "Allow all operations on study_group_members" ON study_group_members
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations on study_group_tags" ON study_group_tags;
CREATE POLICY "Allow all operations on study_group_tags" ON study_group_tags
    FOR ALL USING (true);

-- Create view for study groups with member count
CREATE OR REPLACE VIEW study_groups_with_stats AS
SELECT 
    sg.id,
    sg.name,
    sg.description,
    sg.creator_id,
    u.username as creator_name,
    sg.location,
    sg.total_hours,
    sg.created_at,
    sg.updated_at,
    COUNT(DISTINCT sgm.user_id) as member_count,
    ARRAY_AGG(DISTINCT sgt.tag) FILTER (WHERE sgt.tag IS NOT NULL) as tags
FROM study_groups sg
LEFT JOIN users u ON sg.creator_id = u.id
LEFT JOIN study_group_members sgm ON sg.id = sgm.group_id
LEFT JOIN study_group_tags sgt ON sg.id = sgt.group_id
GROUP BY sg.id, sg.name, sg.description, sg.creator_id, u.username, sg.location, sg.total_hours, sg.created_at, sg.updated_at;

-- Create function to automatically add creator as member
CREATE OR REPLACE FUNCTION add_creator_as_member()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO study_group_members (group_id, user_id, role)
    VALUES (NEW.id, NEW.creator_id, 'creator')
    ON CONFLICT (group_id, user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-add creator
DROP TRIGGER IF EXISTS add_creator_to_group ON study_groups;
CREATE TRIGGER add_creator_to_group
    AFTER INSERT ON study_groups
    FOR EACH ROW
    EXECUTE FUNCTION add_creator_as_member();

-- Add comments
COMMENT ON TABLE study_groups IS 'Study groups for collaborative learning';
COMMENT ON TABLE study_group_members IS 'Members of study groups';
COMMENT ON TABLE study_group_tags IS 'Tags/categories for study groups';
COMMENT ON VIEW study_groups_with_stats IS 'Study groups with member count and tags';
