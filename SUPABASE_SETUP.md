# Supabase Setup Guide for AI Study Coach

## Step 1: Create a Supabase Project

1. Go to [Supabase](https://app.supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Fill in the project details:
   - **Project Name**: AI Study Coach
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your users
5. Wait for the project to be created (takes ~2 minutes)

## Step 2: Get Your Supabase Credentials

1. Once your project is ready, go to **Project Settings** (gear icon)
2. Navigate to **API** section
3. Copy the following values:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public key**: Long string starting with `eyJ...`
   - **service_role key**: Another long string (keep this secret!)
4. Navigate to **Database** section
5. Scroll down to **Connection string** → **URI**
6. Copy the connection string (it looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
   ```
7. Replace `[YOUR-PASSWORD]` with the database password you created in Step 1

## Step 3: Set Up the Database Schema

1. In your Supabase dashboard, click on **SQL Editor** (left sidebar)
2. Click **New Query**
3. Open the file `database/schema.sql` from this project
4. Copy the entire SQL content
5. Paste it into the Supabase SQL Editor
6. Click **Run** to execute the SQL and create the tables

## Step 4: Configure Your Application

1. In your project root, copy the example environment file:
   ```powershell
   Copy-Item .env.example .env
   ```

2. Open `.env` file and replace the placeholders with your actual credentials:

   ```env
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   DATABASE_URL=postgresql://postgres:your-password@db.your-project-ref.supabase.co:5432/postgres
   SECRET_KEY=generate-a-random-secret-key-here
   ```

3. To generate a secure SECRET_KEY, you can run:
   ```powershell
   python -c "import secrets; print(secrets.token_hex(32))"
   ```

## Step 5: Install Dependencies

Install the required Python packages:

```powershell
cd backend
pip install -r requirements.txt
```

## Step 6: Test the Connection

Run the test script to verify your Supabase connection:

```powershell
cd backend
python -c "from supabase_client import supabase_client; supabase_client.test_connection()"
```

You should see:
```
✓ Supabase client initialized successfully
✓ Supabase connection test successful
```

## Step 7: Run the Application

Start the Flask backend:

```powershell
cd backend
python app.py
```

## Troubleshooting

### Connection Issues
- Verify your DATABASE_URL is correct
- Make sure you replaced `[YOUR-PASSWORD]` with your actual database password
- Check that your Supabase project is active

### Import Errors
- Ensure all packages are installed: `pip install -r requirements.txt`
- Try upgrading pip: `python -m pip install --upgrade pip`

### Authentication Errors
- Double-check your SUPABASE_ANON_KEY
- Ensure you copied the complete key (it's very long)
- Verify Row Level Security policies in Supabase

## Security Notes

⚠️ **IMPORTANT**: 
- Never commit your `.env` file to Git
- The `.env.example` should only contain placeholders
- Keep your SUPABASE_SERVICE_KEY secret (don't use it in frontend)
- Use SUPABASE_ANON_KEY for client-side operations

## Database Management

You can manage your database directly from the Supabase dashboard:
- **Table Editor**: View and edit data in a spreadsheet-like interface
- **SQL Editor**: Run custom SQL queries
- **Database**: View table structure and relationships

## Next Steps

- Set up Row Level Security (RLS) policies for production
- Add user authentication using Supabase Auth
- Configure storage buckets if needed
- Set up database backups
