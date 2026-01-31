# AI Study Coach - App Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER'S MOBILE DEVICE                      │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                    EXPO GO APP                          │    │
│  │                                                          │    │
│  │  ┌───────────────────────────────────────────────┐    │    │
│  │  │          AI Study Coach App                    │    │    │
│  │  │                                                 │    │    │
│  │  │  📱 Login Screen (index.js)                   │    │    │
│  │  │      └─> Email & Password Input               │    │    │
│  │  │                                                 │    │    │
│  │  │  📊 Dashboard (dashboard.js)                  │    │    │
│  │  │      ├─> Timer (circular, start/stop)        │    │    │
│  │  │      ├─> Statistics (bar charts)             │    │    │
│  │  │      ├─> Quick Stats (4 cards)               │    │    │
│  │  │      └─> Study Groups Preview                 │    │    │
│  │  │                                                 │    │    │
│  │  │  👥 Study Groups (groups.js)                  │    │    │
│  │  │      ├─> Browse Groups                        │    │    │
│  │  │      ├─> Search Functionality                 │    │    │
│  │  │      └─> Create New Group                     │    │    │
│  │  │                                                 │    │    │
│  │  │  🔧 Config (config.js)                        │    │    │
│  │  │      └─> API_CONFIG.BASE_URL                  │    │    │
│  │  └───────────────────────────────────────────────┘    │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP Requests
                              │ (WiFi Network)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       YOUR COMPUTER                              │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              FLASK BACKEND SERVER                       │    │
│  │              (Running on 0.0.0.0:5000)                 │    │
│  │                                                          │    │
│  │  🔐 Mobile Endpoints:                                   │    │
│  │      POST /api/mobile/login                            │    │
│  │      GET  /api/mobile/stats                            │    │
│  │      GET  /api/mobile/study-groups                     │    │
│  │                                                          │    │
│  │  📚 Study Session Endpoints:                           │    │
│  │      POST /log                                          │    │
│  │      GET  /sessions                                     │    │
│  │                                                          │    │
│  │  📊 Analytics Endpoints:                               │    │
│  │      GET  /api/study-predictions                       │    │
│  │      GET  /api/study-recommendations                   │    │
│  │                                                          │    │
│  │  ┌──────────────────────────────────────────┐         │    │
│  │  │         Business Logic                    │         │    │
│  │  │  ├─> study_analyzer.py                   │         │    │
│  │  │  ├─> recommendation_engine.py            │         │    │
│  │  │  ├─> enhanced_analyzer.py                │         │    │
│  │  │  └─> validation_utils.py                 │         │    │
│  │  └──────────────────────────────────────────┘         │    │
│  │                      │                                  │    │
│  │                      ▼                                  │    │
│  │  ┌──────────────────────────────────────────┐         │    │
│  │  │      SQLite Database                      │         │    │
│  │  │      (study_coach.db)                     │         │    │
│  │  │                                            │         │    │
│  │  │  Tables:                                   │         │    │
│  │  │  └─> study_sessions                       │         │    │
│  │  │       ├─> id                              │         │    │
│  │  │       ├─> subject                         │         │    │
│  │  │       ├─> duration                        │         │    │
│  │  │       ├─> focus_level                     │         │    │
│  │  │       ├─> difficulty                      │         │    │
│  │  │       └─> timestamp                       │         │    │
│  │  └──────────────────────────────────────────┘         │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Data Flow

### 1. User Login Flow
```
User (Phone) → Login Screen
      ↓ (enters email/password)
      ↓ (taps LOGIN)
      ↓
POST /api/mobile/login
      ↓
Backend validates
      ↓ (returns success + token)
      ↓
Navigate to Dashboard
```

### 2. Dashboard Load Flow
```
Dashboard Screen
      ↓
GET /api/mobile/stats
      ↓
Backend queries database
      ↓ (calculates stats)
      ↓
Returns: {todayTime, weeklyTime, mostTimeSubject, bestMonth}
      ↓
Update UI with stats
```

### 3. Study Session Flow
```
User taps "Start Studying"
      ↓
Timer starts (local state)
      ↓ (time increments every second)
      ↓
User taps "Stop Studying"
      ↓
POST /log {subject, duration, focus_level, difficulty}
      ↓
Backend saves to database
      ↓ (returns success)
      ↓
Timer resets
```

### 4. Study Groups Flow
```
Groups Screen
      ↓
GET /api/mobile/study-groups
      ↓
Backend returns groups list
      ↓
Display group cards
      ↓ (user can search/filter)
      ↓
Tap group → View details
```

## 📡 Network Communication

### Connection Requirements:
```
┌──────────────┐           Same WiFi Network          ┌──────────────┐
│              │◄──────────────────────────────────────►│              │
│  Phone       │          192.168.1.x subnet           │  Computer    │
│  (Client)    │                                        │  (Server)    │
│              │    HTTP Requests on Port 5000         │              │
└──────────────┘                                        └──────────────┘
```

### Request/Response Format:
```javascript
// Request (from Phone)
{
  method: 'POST',
  url: 'http://192.168.1.100:5000/api/mobile/login',
  headers: { 'Content-Type': 'application/json' },
  body: { email: 'user@test.com', password: 'pass123' }
}

// Response (from Backend)
{
  success: true,
  user: { email: 'user@test.com', name: 'Student User', id: 1 },
  token: 'demo_token_12345'
}
```

## 🏗️ Project Structure

```
AI Study Coach/
│
├── mobile-app/                    # React Native Frontend
│   ├── app/                       # Screens & Navigation
│   │   ├── _layout.js            # Expo Router configuration
│   │   ├── index.js              # Login screen
│   │   ├── dashboard.js          # Main dashboard
│   │   └── groups.js             # Study groups
│   ├── config.js                 # API configuration
│   └── package.json              # Dependencies
│
├── backend/                       # Flask Backend
│   ├── app.py                    # Main server
│   ├── study_analyzer.py         # Analytics
│   ├── recommendation_engine.py  # Recommendations
│   ├── enhanced_analyzer.py      # Enhanced analytics
│   ├── validation_utils.py       # Validation
│   └── requirements.txt          # Python dependencies
│
├── database/                      # Database files
│   └── study_coach.db            # SQLite database (auto-created)
│
└── docs/                          # Documentation
    ├── README.md                  # Main documentation
    ├── QUICKSTART.md             # Quick setup guide
    ├── MOBILE_README.md          # Mobile app docs
    ├── MIGRATION_SUMMARY.md      # Changes summary
    └── STARTUP_CHECKLIST.md      # Startup checklist
```

## 🔐 Security Considerations

### Current Implementation (Demo):
- ✅ CORS enabled for mobile access
- ✅ Basic input validation
- ⚠️ Simple authentication (demo only)
- ⚠️ No password hashing
- ⚠️ No JWT tokens

### Production Recommendations:
- 🔒 Implement proper authentication (OAuth2, JWT)
- 🔒 Hash passwords with bcrypt
- 🔒 Use HTTPS instead of HTTP
- 🔒 Add rate limiting
- 🔒 Implement API key authentication
- 🔒 Add input sanitization
- 🔒 Use environment variables for secrets

## 🚀 Deployment Architecture (Future)

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRODUCTION                                │
│                                                                  │
│  ┌────────────────┐      ┌────────────────┐                    │
│  │   App Store    │      │  Google Play   │                    │
│  │   (iOS App)    │      │ (Android App)  │                    │
│  └────────┬───────┘      └────────┬───────┘                    │
│           │                       │                             │
│           └───────────┬───────────┘                             │
│                       │                                          │
│                       ▼                                          │
│              ┌────────────────┐                                 │
│              │  API Gateway   │                                 │
│              │  (AWS/Azure)   │                                 │
│              └────────┬───────┘                                 │
│                       │                                          │
│                       ▼                                          │
│              ┌────────────────┐                                 │
│              │ Load Balancer  │                                 │
│              └────────┬───────┘                                 │
│                       │                                          │
│           ┌───────────┼───────────┐                             │
│           ▼           ▼           ▼                             │
│      ┌────────┐  ┌────────┐  ┌────────┐                       │
│      │ Flask  │  │ Flask  │  │ Flask  │                       │
│      │Server 1│  │Server 2│  │Server 3│                       │
│      └───┬────┘  └───┬────┘  └───┬────┘                       │
│          │           │           │                              │
│          └───────────┼───────────┘                              │
│                      ▼                                           │
│              ┌────────────────┐                                 │
│              │   PostgreSQL   │                                 │
│              │    Database    │                                 │
│              └────────────────┘                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 📊 Technology Stack Summary

### Mobile Frontend:
- **Framework**: React Native 0.81.5
- **Platform**: Expo ~54.0.0
- **Routing**: Expo Router ~6.0.22
- **Icons**: @expo/vector-icons
- **HTTP**: Axios (configured but can use fetch)

### Backend:
- **Framework**: Flask (Python)
- **ORM**: SQLAlchemy
- **Database**: SQLite (dev) / PostgreSQL (production)
- **CORS**: Flask-CORS

### Development Tools:
- **Mobile Testing**: Expo Go app
- **Backend Testing**: Python unittest
- **Version Control**: Git
- **IDE**: VS Code (recommended)

## 🎯 Key Features

### Implemented ✅:
- Login authentication
- Dashboard with timer
- Study statistics
- Study groups
- Mobile-responsive design
- Real-time timer
- Visual charts
- Search functionality

### Planned 📋:
- Study session logging from mobile
- Real-time sync between devices
- Push notifications
- Offline support
- User profiles
- Social features
- Gamification
- Analytics dashboard

---

**Note**: This architecture is designed for development and testing with Expo Go. For production deployment, you would build standalone apps using EAS Build and deploy the backend to a cloud service (AWS, Azure, Heroku, etc.).
