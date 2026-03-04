# Study Groups Feature - Migration Guide

## Overview
This guide will help you complete the study groups feature integration by migrating the database schema and testing the new functionality.

## What Was Done

### 1. Backend Infrastructure ✅
- **Database Schema** (`database/add_study_groups.sql`): Created 3 new tables with relationships
  - `study_groups`: Main table for group information
  - `study_group_members`: Many-to-many relationship between users and groups
  - `study_group_tags`: Tags for categorizing groups
  
- **Service Layer** (`backend/study_groups_service.py`): 7 CRUD functions
  - `create_study_group()` - Create new groups with tags
  - `get_user_groups()` - Get all groups a user is member of
  - `get_group_details()` - Get full group information
  - `join_group()` - Add user to a group
  - `leave_group()` - Remove user from a group
  - `update_group()` - Update group details (creator only)
  - `delete_group()` - Delete a group (creator only)

- **REST API** (`backend/app.py`): 7 new endpoints
  - `POST /api/study-groups` - Create group
  - `GET /api/study-groups/<user_id>` - List user's groups
  - `GET /api/study-groups/details/<group_id>` - Group details
  - `POST /api/study-groups/<group_id>/join` - Join group
  - `POST /api/study-groups/<group_id>/leave` - Leave group
  - `PUT /api/study-groups/<group_id>` - Update group
  - `DELETE /api/study-groups/<group_id>` - Delete group

### 2. Mobile App Integration ✅
- **dashboard.js**: Updated to use backend API
  - `loadStudyGroups()` - Fetches from `GET /api/study-groups/<user_id>`
  - `createNewGroup()` - Posts to `POST /api/study-groups`
  
- **groups.js**: Updated to use backend API
  - `loadData()` - Fetches from backend
  - `createNewGroup()` - Posts to backend

## Step-by-Step Migration

### Step 1: Run Database Migration

1. **Open Supabase Dashboard**
   - Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Sign in to your account
   - Select your project: **cbzrozcpzybvnurbxhcg**

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query" button

3. **Run the Migration**
   - Open the file `database/add_study_groups.sql` on your computer
   - Copy **ALL** the contents
   - Paste into the Supabase SQL Editor
   - Click "Run" button (or press Ctrl+Enter)

4. **Verify Success**
   You should see a message: "Success. No rows returned"
   
   To verify tables were created, run this query:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('study_groups', 'study_group_members', 'study_group_tags');
   ```
   
   You should see all 3 tables listed.

### Step 2: Restart Backend Server

1. **Stop the current server** (if running)
   - In PowerShell, press `Ctrl+C`

2. **Start the server again**
   ```powershell
   .\.venv\Scripts\Activate.ps1
   python backend/app.py
   ```

3. **Verify the server is running**
   - You should see: `Running on http://192.168.1.75:5000`
   - Backend will now have access to the new database tables

### Step 3: Test the Integration

#### Test 1: Create a Study Group
1. Open your mobile app (Expo Go)
2. Navigate to Dashboard
3. Tap "Create New Group" button
4. Enter a group name and create it
5. **Expected Result**: Group should appear in the groups list

#### Test 2: Verify in Database
1. In Supabase SQL Editor, run:
   ```sql
   SELECT * FROM study_groups ORDER BY created_at DESC LIMIT 5;
   ```
2. **Expected Result**: You should see the group you just created

#### Test 3: View Groups
1. In mobile app, navigate to "Study Groups" screen
2. **Expected Result**: You should see all your created groups
3. The groups should persist after closing and reopening the app

#### Test 4: Group Details
1. In Supabase SQL Editor, run:
   ```sql
   SELECT * FROM study_groups_with_stats;
   ```
2. **Expected Result**: Should show groups with member counts and tags

## Troubleshooting

### Mobile App Not Showing Groups

**Problem**: Groups list is empty after creation

**Solutions**:
1. Check network connection - make sure phone and computer are on same WiFi
2. Verify backend is running on `http://192.168.1.75:5000`
3. Check console logs in Expo:
   ```
   Looking for errors like:
   "Error fetching study groups"
   "Network error"
   ```
4. Test the API directly in browser:
   - Replace `<user_id>` with your actual user ID
   - Visit: `http://192.168.1.75:5000/api/study-groups/<user_id>`

### Database Migration Errors

**Problem**: SQL errors when running migration

**Common Fixes**:
1. **"column already exists"** - Tables were partially created
   - Run this to drop and retry:
     ```sql
     DROP TABLE IF EXISTS study_group_tags CASCADE;
     DROP TABLE IF EXISTS study_group_members CASCADE;
     DROP TABLE IF EXISTS study_groups CASCADE;
     DROP VIEW IF EXISTS study_groups_with_stats CASCADE;
     ```
   - Then run the full migration again

2. **"relation does not exist"** - Users table missing
   - Make sure you ran the original `database/schema.sql` first

### Backend Errors

**Problem**: "Module not found" or import errors

**Solution**:
```powershell
# Reinstall dependencies
.\.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
```

**Problem**: Backend won't start

**Solution**:
1. Check `.env` file exists with Supabase credentials
2. Verify virtual environment is activated
3. Check for syntax errors:
   ```powershell
   python -m py_compile backend/study_groups_service.py
   python -m py_compile backend/app.py
   ```

## API Testing with curl (Optional)

If you want to test the backend API directly:

### Create a Group
```bash
curl -X POST http://192.168.1.75:5000/api/study-groups \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Study Group",
    "creator_id": "YOUR_USER_ID",
    "description": "Testing the API",
    "location": "Online",
    "tags": ["test", "demo"]
  }'
```

### Get User's Groups
```bash
curl http://192.168.1.75:5000/api/study-groups/YOUR_USER_ID
```

### Get Group Details
```bash
curl http://192.168.1.75:5000/api/study-groups/details/GROUP_ID
```

## Next Steps

After successful migration and testing:

1. **Add More Features** (Optional):
   - Group search functionality
   - Group invitations
   - Group chat/messages
   - Track study hours per group
   - Group activity feed

2. **UI Enhancements**:
   - Add delete group option (swipe to delete)
   - Add edit group details
   - Show group member list
   - Add group settings

3. **Production Preparation**:
   - Update Row Level Security policies (currently set to allow all)
   - Add proper authentication checks
   - Implement rate limiting
   - Add data validation

## Database Schema Reference

### study_groups Table
- `id` (UUID) - Primary key
- `name` (TEXT) - Group name
- `description` (TEXT) - Group description
- `creator_id` (UUID) - Foreign key to users table
- `location` (TEXT) - Meeting location
- `total_hours` (INTEGER) - Total study hours
- `created_at` (TIMESTAMP) - Creation date
- `updated_at` (TIMESTAMP) - Last update

### study_group_members Table
- `group_id` (UUID) - Foreign key to study_groups
- `user_id` (UUID) - Foreign key to users
- `role` (VARCHAR) - Member role (admin/member)
- `joined_at` (TIMESTAMP) - When user joined
- Unique constraint on (group_id, user_id)

### study_group_tags Table
- `group_id` (UUID) - Foreign key to study_groups
- `tag` (VARCHAR) - Tag name

## Support

If you encounter any issues:
1. Check the console logs (both backend and mobile app)
2. Verify all files were updated correctly
3. Ensure database migration ran successfully
4. Test API endpoints directly
5. Check network connectivity between phone and computer

---

**Status**: Ready for migration ✅
**Estimated Time**: 5-10 minutes
**Risk Level**: Low (no data loss, new tables only)
