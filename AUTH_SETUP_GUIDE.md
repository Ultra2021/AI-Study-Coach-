# Authentication System Setup Guide

## Overview
Your AI Study Coach now has a complete authentication system with signup and login functionality! This guide will help you set it up and test it.

## ✅ What's Been Implemented

### Backend (Flask)
1. **Authentication Service** (`backend/auth_service.py`)
   - User registration with validation
   - Password hashing using werkzeug
   - Login authentication
   - User profile management
   - Password change functionality

2. **API Endpoints** (`backend/app.py`)
   - `POST /api/auth/signup` - Create new user account
   - `POST /api/auth/login` - Authenticate user
   - `GET /api/auth/user/<id>` - Get user profile
   - `PUT /api/auth/user/<id>` - Update user profile
   - `POST /api/auth/change-password` - Change password

3. **Database Schema** (`database/schema.sql`)
   - Complete users table with email, username, password hash
   - All study tracking tables (sessions, goals, tasks, etc.)

### Mobile App (React Native)
1. **Login Screen** (`mobile-app/app/index.js`)
   - Email and password inputs with validation
   - Password visibility toggle
   - API integration with backend
   - "Sign Up" link to navigate to signup
   - Stores user data in AsyncStorage on successful login

2. **Signup Screen** (`mobile-app/app/signup.js`)
   - Username, email, password, and confirm password fields
   - Comprehensive validation (email format, password length, matching passwords)
   - API integration with backend
   - "Log In" link to navigate back to login
   - Stores user data in AsyncStorage on successful registration

## 🔧 Setup Steps

### Step 1: Create Database Tables in Supabase

1. Go to your Supabase project: https://cbzrozcpzybvnurbxhcg.supabase.co
2. Click on the **SQL Editor** in the left sidebar
3. Click **New query**
4. Open the file `database/schema.sql` in your project
5. Copy the entire SQL content and paste it into the Supabase SQL Editor
6. Click **Run** to execute the SQL and create all tables

**What this does:**
- Creates the `users` table for authentication
- Creates study tracking tables (study_sessions, goals, tasks, etc.)
- Sets up indexes for performance
- Adds triggers for automatic timestamp updates
- Configures Row Level Security (RLS) policies

### Step 2: Install Mobile App Dependencies

Open PowerShell in the `mobile-app` directory and run:

```powershell
cd "C:\Users\ACER\Noel\Internship Project\AI Study Coach\mobile-app"
npm install
```

This will install the new dependency: `@react-native-async-storage/async-storage`

### Step 3: Update API Base URL (If Needed)

Open `mobile-app/config.js` and verify the BASE_URL is correct:

```javascript
export const API_CONFIG = {
  BASE_URL: 'http://192.168.1.71:5000',  // Update if your IP changed
  // ...
};
```

To find your current IP:
- **Windows**: Run `ipconfig` in PowerShell, look for IPv4 Address
- **Mac/Linux**: Run `ifconfig` or `ip addr`

### Step 4: Start the Backend Server

If not already running, start the backend:

```powershell
cd "C:\Users\ACER\Noel\Internship Project\AI Study Coach"
.\.venv\Scripts\Activate.ps1
cd backend
python app.py
```

You should see:
```
 * Running on http://0.0.0.0:5000
 * Database: Supabase (PostgreSQL)
```

### Step 5: Start the Mobile App

In a new PowerShell window:

```powershell
cd "C:\Users\ACER\Noel\Internship Project\AI Study Coach\mobile-app"
npm start
```

Then scan the QR code with the Expo Go app on your phone (or press `a` for Android emulator / `i` for iOS simulator).

## 🧪 Testing the Authentication System

### Test Signup Flow

1. Open the mobile app
2. You should see the Login screen
3. Click **Sign Up** at the bottom
4. Fill in the form:
   - Username: `testuser` (min 3 characters)
   - Email: `test@example.com` (valid email format)
   - Password: `test123` (min 6 characters)
   - Confirm Password: `test123` (must match)
5. Click **SIGN UP**
6. If successful, you should see "Account created successfully!" and be redirected to the dashboard

### Test Login Flow

1. From the Login screen, enter:
   - Email: `test@example.com`
   - Password: `test123`
2. Click **LOGIN**
3. If successful, you should see "Login successful!" and be redirected to the dashboard

### Verify in Supabase

1. Go to your Supabase project dashboard
2. Click **Table Editor** in the left sidebar
3. Select the `users` table
4. You should see your test user with:
   - username: `testuser`
   - email: `test@example.com`
   - password_hash: (encrypted password)
   - created_at: (timestamp)

## 🔍 Troubleshooting

### "Cannot connect to server"
- Make sure the backend is running on http://localhost:5000
- Verify your phone and computer are on the same WiFi network
- Check that the BASE_URL in `config.js` uses your computer's correct IP address
- Try accessing http://YOUR_IP:5000 in your phone's browser

### "User already exists"
- This email is already registered
- Use a different email or test the login flow instead

### Password Validation Errors
- Username must be at least 3 characters
- Password must be at least 6 characters
- Email must be valid format (e.g., user@domain.com)
- Passwords must match in signup

### Database Connection Errors
- Verify Supabase credentials in `.env` file
- Check that you ran the SQL schema in Supabase
- Confirm the `users` table exists in Supabase Table Editor

## 📱 Features Implemented

### Validation
✅ Email format validation (regex)
✅ Password minimum length (6 characters)
✅ Username minimum length (3 characters)
✅ Password confirmation matching
✅ Duplicate email prevention
✅ Duplicate username prevention

### Security
✅ Password hashing with werkzeug (pbkdf2:sha256)
✅ Passwords never stored in plain text
✅ Email stored in lowercase for consistency
✅ Input sanitization (trimming whitespace)

### User Experience
✅ Password visibility toggle (eye icon)
✅ Loading states during API calls
✅ Clear error messages
✅ Success alerts with navigation
✅ Persistent user data (AsyncStorage)
✅ Easy navigation between Login/Signup screens

## 🎯 Next Steps

Once authentication is working, you can:

1. **Update Dashboard**: Display logged-in user's name and email
2. **Add Logout**: Clear AsyncStorage and navigate back to login
3. **Protect Routes**: Check if user is logged in before showing certain screens
4. **User-Specific Data**: Filter study sessions by user_id
5. **Profile Management**: Allow users to update their profile info

## 📄 File Structure

```
AI Study Coach/
├── backend/
│   ├── app.py                    # Main Flask app with auth endpoints
│   ├── auth_service.py           # Authentication logic (NEW)
│   ├── supabase_client.py        # Database connection
│   └── config.py                 # Environment configuration
├── mobile-app/
│   ├── app/
│   │   ├── index.js              # Login screen (UPDATED)
│   │   ├── signup.js             # Signup screen (NEW)
│   │   └── dashboard.js          # Main dashboard
│   ├── config.js                 # API configuration (UPDATED)
│   └── package.json              # Dependencies (UPDATED)
├── database/
│   └── schema.sql                # Complete database schema
└── .env                          # Supabase credentials
```

## 🚀 Quick Start Commands

**Start Backend:**
```powershell
cd "C:\Users\ACER\Noel\Internship Project\AI Study Coach"
.\.venv\Scripts\Activate.ps1
python backend/app.py
```

**Start Mobile App:**
```powershell
cd "C:\Users\ACER\Noel\Internship Project\AI Study Coach\mobile-app"
npm install  # First time only
npm start
```

**Test Backend API:**
```powershell
# Test signup
curl -X POST http://localhost:5000/api/auth/signup `
  -H "Content-Type: application/json" `
  -d '{"username":"testuser","email":"test@example.com","password":"test123"}'

# Test login
curl -X POST http://localhost:5000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"test@example.com","password":"test123"}'
```

## ✨ Success Indicators

You'll know everything is working when:
- ✅ Backend starts without errors and shows "Supabase (PostgreSQL)" 
- ✅ You can create a new account via the signup screen
- ✅ You can see the new user in Supabase Table Editor
- ✅ You can log in with the created credentials
- ✅ The dashboard loads after successful login
- ✅ User data persists in AsyncStorage

---

**Need Help?**
- Check the console/terminal for error messages
- Verify all environment variables in `.env`
- Ensure the backend is running before testing the mobile app
- Make sure you executed the SQL schema in Supabase
