# Quick Start Guide - Supabase Integration

## Overview
This guide will help you set up Supabase as the database for your AI Study Coach application.

## What You'll Need
- A Supabase account (free tier is fine)
- Your Supabase project credentials
- Python 3.8 or higher
- Internet connection

## Setup Steps

### 1. Create Supabase Account and Project
Follow the detailed instructions in [SUPABASE_SETUP.md](SUPABASE_SETUP.md)

### 2. Install Dependencies
```powershell
cd backend
pip install -r requirements.txt
```

### 3. Configure Environment Variables
```powershell
# Copy the example file
Copy-Item .env.example .env

# Edit .env and add your Supabase credentials
notepad .env
```

Fill in these values in your `.env` file:
- `SUPABASE_URL` - From Supabase Project Settings → API
- `SUPABASE_ANON_KEY` - From Supabase Project Settings → API
- `DATABASE_URL` - From Supabase Project Settings → Database

### 4. Set Up Database Schema
1. Go to your Supabase dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy the contents of `database/schema.sql`
5. Paste into the SQL Editor
6. Click "Run" to create the tables

### 5. Test Your Connection
```powershell
python test_supabase.py
```

You should see all tests pass with checkmarks.

### 6. Migrate Existing Data (Optional)
If you have existing SQLite data to migrate:
```powershell
python migrate_to_supabase.py
```

### 7. Switch to Supabase Backend
```powershell
# Backup your current app.py
cd backend
Move-Item app.py app_sqlite.py

# Use the Supabase version
Move-Item app_supabase.py app.py
```

### 8. Run the Application
```powershell
cd backend
python app.py
```

The server will start on http://localhost:5000

## Testing the API

### Create a Study Session
```powershell
curl -X POST http://localhost:5000/api/study-sessions `
  -H "Content-Type: application/json" `
  -d '{
    "subject": "Mathematics",
    "duration": 60,
    "focus_level": 4,
    "difficulty": 3
  }'
```

### Get All Sessions
```powershell
curl http://localhost:5000/api/study-sessions
```

### Health Check
```powershell
curl http://localhost:5000/api/health
```

## Troubleshooting

### "Module not found" errors
```powershell
pip install -r requirements.txt --upgrade
```

### "Configuration error"
- Make sure your `.env` file exists in the project root
- Verify all required variables are set
- Check for typos in variable names

### "Database connection failed"
- Verify your `DATABASE_URL` is correct
- Make sure you replaced `[YOUR-PASSWORD]` with your actual password
- Check that your Supabase project is active
- Ensure you ran the `schema.sql` to create tables

### "Table doesn't exist"
- Run the SQL schema in Supabase SQL Editor
- Check the "Table Editor" in Supabase to confirm tables were created

## File Structure
```
AI Study Coach/
├── .env                      # Your credentials (don't commit!)
├── .env.example              # Template for credentials
├── .gitignore               # Protects .env from being committed
├── SUPABASE_SETUP.md        # Detailed setup instructions
├── test_supabase.py         # Connection test script
├── migrate_to_supabase.py   # Data migration tool
├── backend/
│   ├── app.py               # Main application (Supabase version)
│   ├── app_sqlite.py        # Original SQLite version (backup)
│   ├── config.py            # Configuration loader
│   ├── supabase_client.py   # Supabase client initialization
│   ├── database_service.py  # Database operations
│   └── requirements.txt     # Updated dependencies
└── database/
    └── schema.sql           # Database schema for Supabase
```

## Next Steps
- Set up the mobile app to use your API
- Configure real-time subscriptions (Supabase feature)
- Add user authentication with Supabase Auth
- Set up Row Level Security (RLS) policies
- Enable database backups

## Support
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- Check `SUPABASE_SETUP.md` for detailed setup instructions
