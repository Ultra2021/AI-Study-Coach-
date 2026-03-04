-- AI Study Coach Database Schema for Supabase (PostgreSQL)
-- Run this in your Supabase SQL Editor to set up the database

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create study_sessions table
CREATE TABLE IF NOT EXISTS study_sessions (
    id SERIAL PRIMARY KEY,
    subject VARCHAR(100) NOT NULL,
    duration INTEGER NOT NULL CHECK (duration > 0 AND duration <= 1440),
    focus_level INTEGER NOT NULL CHECK (focus_level >= 1 AND focus_level <= 5),
    difficulty INTEGER NOT NULL CHECK (difficulty >= 1 AND difficulty <= 5),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on timestamp for faster queries
CREATE INDEX IF NOT EXISTS idx_study_sessions_timestamp ON study_sessions(timestamp DESC);

-- Create index on subject for filtering
CREATE INDEX IF NOT EXISTS idx_study_sessions_subject ON study_sessions(subject);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_study_sessions_updated_at ON study_sessions;
CREATE TRIGGER update_study_sessions_updated_at
    BEFORE UPDATE ON study_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create users table (for future authentication integration)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add user_id to study_sessions (optional, for multi-user support)
-- Uncomment if you want to add user authentication later
-- ALTER TABLE study_sessions ADD COLUMN user_id UUID REFERENCES users(id);
-- CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON study_sessions(user_id);

-- Enable Row Level Security (RLS) - Recommended for production
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your authentication needs)
-- For development, allow all operations
CREATE POLICY "Allow all operations on study_sessions for now" ON study_sessions
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on users for now" ON users
    FOR ALL USING (true);

-- Insert sample data (optional, for testing)
INSERT INTO study_sessions (subject, duration, focus_level, difficulty)
VALUES 
    ('Mathematics', 60, 4, 3),
    ('Physics', 45, 3, 4),
    ('Chemistry', 90, 5, 2),
    ('Computer Science', 120, 5, 3)
ON CONFLICT DO NOTHING;

-- Create view for study statistics (optional)
CREATE OR REPLACE VIEW study_statistics AS
SELECT 
    subject,
    COUNT(*) as session_count,
    SUM(duration) as total_duration,
    AVG(duration) as avg_duration,
    AVG(focus_level) as avg_focus,
    AVG(difficulty) as avg_difficulty,
    MAX(timestamp) as last_session
FROM study_sessions
GROUP BY subject;

COMMENT ON TABLE study_sessions IS 'Stores individual study sessions with metrics';
COMMENT ON TABLE users IS 'User accounts for the AI Study Coach application';
COMMENT ON VIEW study_statistics IS 'Aggregated statistics per subject';
