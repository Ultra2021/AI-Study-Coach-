# Enhanced Study Groups Database Tables

## Overview
Complete database schema for Study Groups feature with Tasks, Files, Notes, and Activity Tracking.

## Database Tables Summary

### Core Tables
1. **study_groups** - Main group information
2. **study_group_members** - Group membership
3. **study_group_tags** - Group categorization

### Enhanced Features (New)
4. **study_group_tasks** - Task management
5. **study_group_files** - File sharing
6. **study_group_notes** - Collaborative notes
7. **study_group_activities** - Activity logging

## Table Details

### 1. study_group_tasks
**Purpose:** Manage tasks and assignments within study groups

**Columns:**
- `id` (UUID) - Primary key
- `group_id` (UUID) - Foreign key to study_groups
- `title` (VARCHAR 200) - Task title
- `description` (TEXT) - Detailed description
- `assigned_to` (UUID) - Foreign key to users (nullable)
- `created_by` (UUID) - Foreign key to users
- `status` (VARCHAR 20) - 'pending', 'in_progress', 'completed', 'cancelled'
- `priority` (VARCHAR 10) - 'low', 'medium', 'high', 'urgent'
- `due_date` (TIMESTAMP) - When task is due
- `completed_at` (TIMESTAMP) - When task was completed
- `created_at` (TIMESTAMP) - Creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

**Indexes:**
- group_id, assigned_to, status, due_date, created_by

**Use Cases:**
- Assign homework to group members
- Track project deadlines
- Organize study schedules
- Monitor task completion

### 2. study_group_files
**Purpose:** Share files and study materials within groups

**Columns:**
- `id` (UUID) - Primary key
- `group_id` (UUID) - Foreign key to study_groups
- `uploaded_by` (UUID) - Foreign key to users
- `file_name` (VARCHAR 255) - Original filename
- `file_type` (VARCHAR 50) - 'pdf', 'doc', 'image', 'video', etc.
- `file_size` (BIGINT) - Size in bytes
- `file_url` (TEXT) - URL to file storage
- `description` (TEXT) - File description
- `download_count` (INTEGER) - Track popularity
- `created_at` (TIMESTAMP) - Upload timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

**Indexes:**
- group_id, uploaded_by, file_type, created_at

**Use Cases:**
- Share lecture notes
- Upload study guides
- Share presentation slides
- Store reference materials

### 3. study_group_notes
**Purpose:** Create and share collaborative notes

**Columns:**
- `id` (UUID) - Primary key
- `group_id` (UUID) - Foreign key to study_groups
- `created_by` (UUID) - Foreign key to users
- `title` (VARCHAR 200) - Note title
- `content` (TEXT) - Note content
- `is_pinned` (BOOLEAN) - Pin important notes
- `tags` (TEXT[]) - Array of tags for organization
- `created_at` (TIMESTAMP) - Creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

**Indexes:**
- group_id, created_by, is_pinned, created_at

**Use Cases:**
- Study session summaries
- Important concepts
- Quick reference guides
- Meeting notes

### 4. study_group_activities
**Purpose:** Track all activities within study groups

**Columns:**
- `id` (UUID) - Primary key
- `group_id` (UUID) - Foreign key to study_groups
- `user_id` (UUID) - Foreign key to users
- `activity_type` (VARCHAR 50) - Type of activity
- `description` (TEXT) - Activity description
- `metadata` (JSONB) - Additional data
- `created_at` (TIMESTAMP) - Activity timestamp

**Activity Types:**
- `task_created` - New task added
- `task_completed` - Task finished
- `file_uploaded` - File shared
- `note_added` - Note created
- `member_joined` - New member
- `member_left` - Member left
- `group_updated` - Group settings changed

**Indexes:**
- group_id, user_id, activity_type, created_at

**Use Cases:**
- Activity feed
- Notification system
- Audit trail
- Member engagement tracking

## Database Views

### study_group_tasks_detailed
Combines tasks with user and group information
```sql
SELECT * FROM study_group_tasks_detailed 
WHERE group_id = 'your-group-id';
```

### study_group_files_detailed
Combines files with uploader and group details
```sql
SELECT * FROM study_group_files_detailed 
WHERE group_id = 'your-group-id'
ORDER BY created_at DESC;
```

### study_group_notes_detailed
Combines notes with author and group information
```sql
SELECT * FROM study_group_notes_detailed 
WHERE group_id = 'your-group-id' AND is_pinned = TRUE;
```

### study_group_recent_activities
Shows recent activities across all groups
```sql
SELECT * FROM study_group_recent_activities 
WHERE group_id = 'your-group-id'
LIMIT 20;
```

## Automatic Features

### Triggers
1. **Auto-update timestamps** - All tables update `updated_at` automatically
2. **Activity logging** - Tasks, files, and notes auto-log to activity table
3. **Member creation** - Group creators automatically added as first member

### Row Level Security
- Enabled on all tables
- Currently set to "allow all" for development
- **Production:** Implement user-based policies

## Migration Steps

### Step 1: Run Core Migration
```bash
# In Supabase SQL Editor
# Run: database/add_study_groups.sql
```

### Step 2: Run Enhanced Migration
```bash
# In Supabase SQL Editor  
# Run: database/study_groups_enhanced.sql
```

### Step 3: Verify Tables
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'study_group%';
```

**Expected Output:**
- study_groups
- study_group_members
- study_group_tags
- study_group_tasks
- study_group_files
- study_group_notes
- study_group_activities

### Step 4: Verify Views
```sql
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name LIKE 'study_group%';
```

**Expected Output:**
- study_groups_with_stats
- study_group_tasks_detailed
- study_group_files_detailed
- study_group_notes_detailed
- study_group_recent_activities

## API Endpoints Needed

### Tasks API
```
POST   /api/study-groups/:groupId/tasks        # Create task
GET    /api/study-groups/:groupId/tasks        # List tasks
GET    /api/study-groups/:groupId/tasks/:id    # Get task details
PUT    /api/study-groups/:groupId/tasks/:id    # Update task
DELETE /api/study-groups/:groupId/tasks/:id    # Delete task
PATCH  /api/study-groups/:groupId/tasks/:id/complete  # Mark complete
```

### Files API
```
POST   /api/study-groups/:groupId/files        # Upload file
GET    /api/study-groups/:groupId/files        # List files
GET    /api/study-groups/:groupId/files/:id    # Download file
DELETE /api/study-groups/:groupId/files/:id    # Delete file
PATCH  /api/study-groups/:groupId/files/:id/download  # Track download
```

### Notes API
```
POST   /api/study-groups/:groupId/notes        # Create note
GET    /api/study-groups/:groupId/notes        # List notes
GET    /api/study-groups/:groupId/notes/:id    # Get note
PUT    /api/study-groups/:groupId/notes/:id    # Update note
DELETE /api/study-groups/:groupId/notes/:id    # Delete note
PATCH  /api/study-groups/:groupId/notes/:id/pin  # Toggle pin
```

### Activities API
```
GET    /api/study-groups/:groupId/activities   # Get activity feed
GET    /api/study-groups/:groupId/activities/recent  # Last 20 activities
```

## Sample Queries

### Get All Tasks for a Group
```sql
SELECT * FROM study_group_tasks_detailed
WHERE group_id = 'your-group-id'
ORDER BY 
    CASE priority
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
    END,
    due_date ASC;
```

### Get Pending Tasks Assigned to User
```sql
SELECT * FROM study_group_tasks_detailed
WHERE assigned_to_email = 'user@example.com'
AND status = 'pending'
ORDER BY due_date ASC;
```

### Get Recent Files in Group
```sql
SELECT * FROM study_group_files_detailed
WHERE group_id = 'your-group-id'
ORDER BY created_at DESC
LIMIT 10;
```

### Get Popular Files (Most Downloaded)
```sq
SELECT * FROM study_group_files_detailed
WHERE group_id = 'your-group-id'
ORDER BY download_count DESC
LIMIT 5;
```

### Get Pinned Notes
```sql
SELECT * FROM study_group_notes_detailed
WHERE group_id = 'your-group-id'
AND is_pinned = TRUE
ORDER BY updated_at DESC;
```

### Get Recent Group Activity
```sql
SELECT * FROM study_group_recent_activities
WHERE group_id = 'your-group-id'
ORDER BY created_at DESC
LIMIT 20;
```

### Get Task Completion Statistics
```sql
SELECT 
    group_name,
    COUNT(*) as total_tasks,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_tasks,
    COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tasks,
    ROUND(
        COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*),
        2
    ) as completion_percentage
FROM study_group_tasks_detailed
WHERE group_id = 'your-group-id'
GROUP BY group_name;
```

## Security Considerations

### Production RLS Policies

**Tasks - Only group members can view/edit:**
```sql
CREATE POLICY "Group members can view tasks" ON study_group_tasks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM study_group_members
            WHERE group_id = study_group_tasks.group_id
            AND user_id = auth.uid()
        )
    );
```

**Files - Only group members can access:**
```sql
CREATE POLICY "Group members can view files" ON study_group_files
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM study_group_members
            WHERE group_id = study_group_files.group_id
            AND user_id = auth.uid()
        )
    );
```

**Notes - Only creator can delete:**
```sql
CREATE POLICY "Creator can delete notes" ON study_group_notes
    FOR DELETE USING (created_by = auth.uid());
```

## Performance Optimization

### Recommended Indexes (Already Created)
- All foreign keys indexed
- Search fields indexed (status, priority, file_type)
- Sort fields indexed (created_at DESC)
- Composite indexes for common queries

### Query Optimization Tips
1. Use views for complex joins
2. Add LIMIT to prevent large result sets
3. Use pagination for lists
4. Cache frequently accessed data
5. Use materialized views for statistics

## Maintenance

### Regular Tasks
1. **Clean old activities** (older than 90 days)
```sql
DELETE FROM study_group_activities
WHERE created_at < NOW() - INTERVAL '90 days';
```

2. **Archive completed tasks** (older than 30 days)
```sql
UPDATE study_group_tasks
SET status = 'archived'
WHERE status = 'completed'
AND completed_at < NOW() - INTERVAL '30 days';
```

3. **Monitor storage usage**
```sql
SELECT 
    pg_size_pretty(SUM(file_size)) as total_storage
FROM study_group_files;
```

## Testing Data

### Create Sample Task
```sql
INSERT INTO study_group_tasks (
    group_id, title, description, created_by, status, priority, due_date
)
VALUES (
    'your-group-id',
    'Review Chapter 5',
    'Complete review questions 1-10',
    'your-user-id',
    'pending',
    'high',
    NOW() + INTERVAL '7 days'
);
```

### Create Sample Note
```sql
INSERT INTO study_group_notes (
    group_id, created_by, title, content, is_pinned, tags
)
VALUES (
    'your-group-id',
    'your-user-id',
    'Important Formulas',
    'Key formulas for the exam:\n1. E = mc²\n2. F = ma\n3. V = IR',
    TRUE,
    ARRAY['physics', 'formulas', 'exam']
);
```

## Troubleshooting

### Common Issues

**Issue:** Foreign key constraint violation
**Solution:** Ensure group_id and user_id exist before inserting

**Issue:** Permission denied
**Solution:** Check RLS policies and user authentication

**Issue:** Slow queries
**Solution:** Check indexes, use EXPLAIN ANALYZE

**Issue:** Duplicate activities
**Solution:** Triggers firing multiple times, check trigger definitions

---

**Status:** Ready for implementation  
**Tables:** 7 core tables + 5 views  
**Security:** RLS enabled (development mode)  
**Performance:** Fully indexed  
**Ready For:** Backend API integration
