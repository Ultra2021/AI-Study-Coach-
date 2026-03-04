# Study Hours Tracking for Study Groups

## 🎯 Overview

The Study Hours feature allows study group members to:
- Log individual study sessions within groups
- Track group-wide study statistics
- Set and monitor weekly/monthly study goals
- View member contributions and subject breakdowns
- Monitor daily, weekly, and monthly progress

## 📋 Setup Instructions

### 1. Run Database Migration

First, apply the database migration to add study hours support:

```powershell
# Navigate to project directory
cd "C:\Users\ACER\Noel\Internship Project\AI Study Coach"

# Connect to Supabase and run the migration
# Option 1: Via Supabase Dashboard
# - Go to https://app.supabase.com/project/cbzrozcpzybvnurbxhcg/editor
# - Open the SQL Editor
# - Copy and paste the contents of database/add_study_goals.sql
# - Click "Run"

# Option 2: Via PostgreSQL command line (if you have psql installed)
psql "postgresql://postgres:NoelBiju@2026@db.cbzrozcpzybvnurbxhcg.supabase.co:5432/postgres" -f "AI Study Coach\database\add_study_goals.sql"
```

### 2. Start the Backend Server

```powershell
cd "AI Study Coach\backend"
& 'C:\Users\ACER\Noel\Internship Project\.venv\bin\python.exe' app.py
```

### 3. Test the Endpoints

```powershell
cd "AI Study Coach\backend"
& 'C:\Users\ACER\Noel\Internship Project\.venv\bin\python.exe' test_study_hours.py
```

## 🔌 API Endpoints

### 1. Log Study Session
Log a study session for a group member.

**Endpoint:** `POST /api/study-groups/{group_id}/study-hours/log`

**Request Body:**
```json
{
  "user_id": "uuid",
  "subject": "Mathematics",
  "duration": 60,
  "notes": "Optional notes about the session"
}
```

**Response:**
```json
{
  "success": true,
  "session": {
    "id": "uuid",
    "subject": "Mathematics",
    "duration": 60,
    "session_date": "2026-02-21T10:30:00"
  },
  "message": "Study session logged successfully"
}
```

### 2. Get Group Statistics
Get study statistics for a group over a specified time period.

**Endpoint:** `GET /api/study-groups/{group_id}/study-hours/stats?user_id={id}&days={7}`

**Response:**
```json
{
  "success": true,
  "stats": {
    "total_hours": 15.5,
    "total_sessions": 12,
    "average_session_length": 77.5,
    "member_breakdown": [
      {
        "user_id": "uuid",
        "username": "John Doe",
        "hours": 8.5,
        "sessions": 7
      }
    ],
    "subject_breakdown": [
      {
        "subject": "Mathematics",
        "hours": 6.0,
        "sessions": 5
      }
    ],
    "daily_breakdown": [
      {
        "date": "2026-02-21",
        "hours": 2.5,
        "sessions": 2
      }
    ]
  }
}
```

### 3. Get Member Study Hours
Get study hours for a specific member in the group.

**Endpoint:** `GET /api/study-groups/{group_id}/study-hours/member?user_id={id}&target_user_id={optional}`

**Response:**
```json
{
  "success": true,
  "hours": {
    "total": 25.5,
    "this_week": 8.5,
    "this_month": 20.0,
    "total_sessions": 18,
    "recent_sessions": [...]
  }
}
```

### 4. Set Study Goals
Set weekly and monthly study hour goals for the group (admin only).

**Endpoint:** `POST /api/study-groups/{group_id}/study-hours/goals`

**Request Body:**
```json
{
  "user_id": "uuid",
  "weekly_hours": 10,
  "monthly_hours": 40
}
```

**Response:**
```json
{
  "success": true,
  "message": "Study goals set successfully",
  "goals": {
    "weekly_study_goal": 10,
    "monthly_study_goal": 40
  }
}
```

### 5. Get Goal Progress
Get progress towards study goals.

**Endpoint:** `GET /api/study-groups/{group_id}/study-hours/progress?user_id={id}`

**Response:**
```json
{
  "success": true,
  "progress": {
    "weekly": {
      "goal": 10,
      "actual": 7.5,
      "percentage": 75.0
    },
    "monthly": {
      "goal": 40,
      "actual": 28.5,
      "percentage": 71.3
    }
  }
}
```

## 💡 Usage Examples

### Example 1: Group Study Session
```javascript
// Member logs a study session after studying
fetch('http://localhost:5000/api/study-groups/{groupId}/study-hours/log', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: userId,
    subject: 'Physics',
    duration: 90,
    notes: 'Studied quantum mechanics chapters 1-3'
  })
})
```

### Example 2: View Group Progress
```javascript
// View how the group is doing this week
fetch(`http://localhost:5000/api/study-groups/{groupId}/study-hours/stats?user_id=${userId}&days=7`)
  .then(res => res.json())
  .then(data => {
    console.log(`Total study hours this week: ${data.stats.total_hours}`);
    console.log(`Most studied subject: ${data.stats.subject_breakdown[0].subject}`);
  });
```

### Example 3: Check Personal Progress
```javascript
// See your own contribution to the group
fetch(`http://localhost:5000/api/study-groups/{groupId}/study-hours/member?user_id=${userId}`)
  .then(res => res.json())
  .then(data => {
    console.log(`Your hours this week: ${data.hours.this_week}`);
    console.log(`Total sessions: ${data.hours.total_sessions}`);
  });
```

## 📱 Mobile App Integration (Next Steps)

To integrate this into your mobile app, you would add:

1. **Study Session Logger** - Modal to log sessions with subject, duration, and notes
2. **Group Stats Dashboard** - Display group statistics with charts
3. **Goal Progress Widget** - Show progress bars for weekly/monthly goals
4. **Member Leaderboard** - Rank members by study hours
5. **Subject Analytics** - Pie chart of subjects studied

Would you like me to create the mobile app UI components for this?

## 🔒 Permissions

- **Any Group Member** can:
  - Log their own study sessions
  - View group statistics
  - View their own study hours
  - View other members' hours
  
- **Group Creator/Admin** can:
  - Set study goals for the group
  - All member permissions

## 📊 Database Schema Changes

The migration adds:

```sql
-- To study_groups table
weekly_study_goal INTEGER    -- Weekly hour goal
monthly_study_goal INTEGER   -- Monthly hour goal

-- To study_sessions table
study_group_id UUID          -- Links session to a study group
```

## 🐛 Troubleshooting

### Issue: "Failed to log study session"
- Make sure you're a member of the study group
- Check that the backend server is running
- Verify the database migration was applied

### Issue: "Only group creator can set study goals"
- Only the user who created the group can set goals
- Check that you're using the correct user_id

### Issue: No statistics showing
- Make sure you've logged at least one study session
- Check the date range (default is 7 days)

## 🎉 Features Summary

✅ Log individual study sessions  
✅ Track group-wide statistics  
✅ Monitor member contributions  
✅ Analyze subjects studied  
✅ Set weekly/monthly goals  
✅ Track goal progress  
✅ Daily/weekly/monthly breakdowns  
✅ Recent session history  

Enjoy tracking your study hours! 📚✨
