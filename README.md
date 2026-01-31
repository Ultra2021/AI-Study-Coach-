# AI Study Coach

An intelligent full-stack application designed to help students enhance their learning experience through AI-powered study assistance and personalized coaching. Now featuring a modern **React Native mobile app** with Expo!

## Project Structure

```
AI Study Coach/
├── backend/                    # Python Flask backend API
│   ├── app.py                 # Main Flask application with API endpoints
│   ├── study_analyzer.py      # Rule-based analysis engine
│   ├── recommendation_engine.py # Personalized recommendation system  
│   ├── enhanced_analyzer.py   # Enhanced analytics
│   ├── validation_utils.py    # Input validation and utility functions
│   ├── test_study_coach.py    # Comprehensive test suite
│   ├── requirements.txt       # Python dependencies
│   └── study_coach.db        # SQLite database (auto-created)
├── mobile-app/                 # React Native mobile app (NEW!)
│   ├── app/                   # App screens and navigation
│   │   ├── index.js          # Login screen
│   │   ├── dashboard.js      # Main dashboard with timer
│   │   ├── groups.js         # Study groups screen
│   │   └── _layout.js        # Navigation layout
│   ├── config.js             # API configuration
│   ├── package.json          # Dependencies
│   └── MOBILE_README.md      # Mobile app documentation
├── database/                   # Database schemas and migrations
├── docs/                      # Project documentation
├── QUICKSTART.md              # Quick setup guide
├── run.ps1                    # Helper script to run the app
└── README.md                  # This file
```

## Technology Stack

- **Backend**: Python Flask with SQLAlchemy ORM
- **Mobile Frontend**: React Native with Expo (NEW!)
- **Navigation**: Expo Router (file-based routing)
- **Database**: SQLite for development (easily portable to PostgreSQL/MySQL)
- **API**: RESTful API with CORS support for mobile
- **Testing**: Python unittest with edge case coverage

## Features

### 🎯 Core Functionality
- **Study Session Logging**: Track subject, duration, focus level, and difficulty
- **Data Analytics**: Analyze study patterns and performance trends
- **Smart Recommendations**: Generate personalized study suggestions
- **Progress Dashboard**: Visual overview of study statistics and recent sessions

### 📱 Mobile App Features (NEW!)
- **Login Screen**: Clean, modern authentication interface
- **Dashboard Timer**: Start/stop study sessions with circular timer
- **Live Statistics**: Real-time study patterns with visual charts
- **Quick Stats**: Today's time, weekly time, most studied subject, best month
- **Study Groups**: Browse, search, and manage study groups
- **Cross-Platform**: Runs on iOS and Android via Expo Go

### 📊 Data Analysis & Recommendations
- **Pattern Detection**: Identifies issues like long sessions with low focus
- **Subject Analysis**: Compares performance across different subjects  
- **Adaptive Suggestions**: Recommendations improve with more data
- **Plain English Insights**: Easy-to-understand feedback for students

### ✅ Validation & Error Handling
- **Comprehensive Input Validation**: Both client-side and server-side
- **Real-time Feedback**: Immediate validation as users type
- **Edge Case Handling**: Graceful handling of extreme values and missing data
- **User-friendly Error Messages**: Clear explanations of validation failures

## 🚀 Quick Start

### Option 1: Using the Helper Script (Recommended)
```powershell
cd "c:\Users\ACER\Noel\Internship Project\AI Study Coach"
.\run.ps1
```

### Option 2: Manual Setup

#### For Mobile App (React Native + Expo)
1. **Install dependencies**:
```powershell
cd mobile-app
npm install
```

2. **Find your IP address**:
```powershell
ipconfig
```
Look for IPv4 Address (e.g., 192.168.1.100)

3. **Update config.js** with your IP:
```javascript
BASE_URL: 'http://YOUR_IP_ADDRESS:5000'
```

4. **Start backend**:
```powershell
cd backend
python app.py
```

5. **Start mobile app**:
```powershell
cd mobile-app
npm start
```

6. **Run on your phone**:
- Install "Expo Go" from App Store or Google Play
- Scan QR code from terminal
- App will load on your phone!

📖 See [QUICKSTART.md](QUICKSTART.md) for detailed mobile setup instructions.

## API Endpoints

### Mobile Endpoints (NEW!)
- `POST /api/mobile/login` - Mobile authentication
- `GET /api/mobile/stats` - User statistics for dashboard
- `GET /api/mobile/study-groups` - Study groups list

### Study Sessions
- `POST /log` - Log a new study session
- `GET /sessions` - Retrieve all study sessions

### Analytics & Recommendations  
- `GET /api/study-predictions` - Get enhanced analysis and predictions
- `GET /api/study-recommendations` - Get personalized study recommendations

### Error Responses
All endpoints return consistent error formatting with validation details and helpful hints.

## Testing Coverage

The test suite ([test_study_coach.py](backend/test_study_coach.py)) covers:

### API Endpoint Testing
- Valid and invalid input scenarios
- Missing fields and malformed data
- Boundary value testing (min/max values)
- Unicode character handling
- Empty database scenarios

### Edge Cases & Validation
- Extreme session durations (1 min to 24 hours)
- Invalid focus/difficulty ratings (outside 1-5 range)
- Empty subjects and very long subject names
- Repeated identical sessions
- Malformed timestamps

### Analysis Engine Testing
- Empty dataset handling
- Single session analysis
- Pattern detection with consistent data
- Extreme value analysis (300-minute sessions, etc.)
- Quick summary generation

### Recommendation Engine Testing
- Beginner vs experienced user recommendations
- Personalized suggestions based on patterns
- Complete recommendation category coverage
- Priority action identification

## 💻 Getting Started

### Prerequisites
- **For Mobile App**: Node.js 14+, npm, mobile device with Expo Go app
- **For Backend**: Python 3.7+
- Text editor or IDE (VS Code recommended)

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd "AI Study Coach/backend"
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run the Flask application (accessible from mobile devices):
   ```bash
   python app.py
   ```
   
4. The API will be available at `http://0.0.0.0:5000`

### Mobile App Setup (React Native)
See [QUICKSTART.md](QUICKSTART.md) for detailed instructions or:

1. Install dependencies:
   ```bash
   cd mobile-app
   npm install
   ```

2. Update config.js with your computer's IP address

3. Start Expo:
   ```bash
   npm start
   ```

4. Scan QR code with Expo Go app on your phone!

### Running Tests
Execute the comprehensive test suite:
```bash
cd "AI Study Coach/backend"
python test_study_coach.py
```

The test suite includes:
- 40+ test cases covering all functionality
- Edge case validation
- Error handling verification
- Data model testing

## 🎨 Design Decisions & Architecture

### Mobile-First Approach (NEW!)
- **Modern UI**: Clean, minimalist design based on provided mockups
- **Circular Timer**: Intuitive study session tracking
- **Visual Statistics**: Easy-to-read charts and cards
- **Cross-Platform**: Single codebase for iOS and Android
- **Expo Go**: No need to build native apps for testing

### Code Quality & Maintainability
- **Modular Architecture**: Separated validation, analysis, and recommendation logic
- **Comprehensive Documentation**: All functions and classes have detailed docstrings
- **Consistent Error Handling**: Standardized error responses across all endpoints
- **Input Sanitization**: Centralized validation and data cleaning

### User Experience Focus
- **Real-time Validation**: Immediate feedback prevents submission errors
- **Mobile-Optimized**: Touch-friendly interface with smooth animations
- **Student-friendly Language**: All feedback uses clear, encouraging language
- **Visual Feedback**: Color-coded validation states and clear error messages

### Scalability Considerations  
- **Database Agnostic**: Easy migration from SQLite to production databases
- **Pagination Ready**: Comments indicate where to add pagination for large datasets
- **Modular Components**: Easy to extend with new analysis algorithms
- **API Versioning Ready**: Clean endpoint structure for future versions

## Data Model

### StudySession Table
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | Integer | Primary Key | Auto-incremented unique identifier |
| subject | String(100) | Not Null | Subject being studied |
| duration | Integer | 1-1440 | Session duration in minutes |
| focus_level | Integer | 1-5 | Focus rating (1=Poor, 5=Excellent) |
| difficulty | Integer | 1-5 | Difficulty rating (1=Very Easy, 5=Very Hard) |
| timestamp | DateTime | Auto | When the session was logged (UTC) |

### Validation Rules
- **Subject**: Non-empty string, max 100 characters
- **Duration**: 1-1440 minutes (up to 24 hours)  
- **Focus/Difficulty**: Integer 1-5 inclusive
- **Automatic sanitization**: Trims whitespace, validates data types

## Contributing

### Code Style
- Follow PEP 8 for Python code
- Use descriptive variable names and comprehensive comments
- Add tests for any new functionality
- Maintain consistent error handling patterns

### Adding New Features
1. Create tests first (TDD approach)
2. Implement functionality with comprehensive error handling
3. Add client-side validation if applicable
4. Update documentation

## Future Enhancements

- **Machine Learning Integration**: Replace rule-based analysis with ML models
- **Data Visualization**: Add charts and graphs to the dashboard
- **Study Planning**: Calendar integration and study schedule generation  
- **Social Features**: Study groups and progress sharing
- **Mobile App**: Native mobile application
- **Advanced Analytics**: Learning curve analysis and prediction

## License

This project is designed for educational purposes as part of an internship program.