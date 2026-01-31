# AI Study Coach - React Native Mobile App

Complete React Native mobile application built with Expo Router for the AI Study Coach project.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo Go app on your mobile device (for testing)

### Installation

1. Navigate to the mobile-app directory:
```bash
cd "C:\Users\ACER\Noel\Internship Project\AI Study Coach\mobile-app"
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npx expo start
```

4. Open the app:
   - Scan the QR code with Expo Go (Android) or Camera app (iOS)
   - Press `a` for Android emulator
   - Press `i` for iOS simulator
   - Press `w` to open in web browser

## ⚙️ Configuration

### Backend URL Configuration

Before running the app, update the `BASE_URL` in both screen files:

**app/index.js** (Line 15):
```javascript
const BASE_URL = 'http://YOUR_LOCAL_IP:5000';
```

**app/dashboard.js** (Line 14):
```javascript
const BASE_URL = 'http://YOUR_LOCAL_IP:5000';
```

**Finding your local IP:**
- Windows: Run `ipconfig` in CMD, look for IPv4 Address
- Mac/Linux: Run `ifconfig` or `ip addr`
- Example: `http://192.168.1.5:5000`

> **Note:** Do NOT use `localhost` or `127.0.0.1` - these won't work on physical devices. Use your computer's actual IP address on the local network.

### Starting the Flask Backend

In a separate terminal, ensure your Flask backend is running:
```bash
cd "C:\Users\ACER\Noel\Internship Project\AI Study Coach"
python backend/app.py
```

The backend should be accessible at `http://YOUR_IP:5000`

## 📱 Features

### Log Session Screen (/)
- Log new study sessions with validation
- Input: Subject, Duration, Focus Level (1-5), Difficulty (1-5)
- Interactive rating buttons for focus and difficulty
- Navigate to dashboard after logging

### Dashboard Screen (/dashboard)
- View study statistics (total sessions, time, averages)
- AI-powered predictions for optimal study duration
- Personalized study recommendations
- List of recent study sessions
- Pull-to-refresh functionality
- Navigate back to log new sessions

## 🛠️ Technology Stack

- **React Native** - Mobile framework
- **Expo Router** - File-based routing
- **Expo** - Development platform
- **Flask Backend** - Existing Python API

## 📂 Project Structure

```
mobile-app/
├── app/
│   ├── _layout.js      # Root layout with navigation
│   ├── index.js        # Log session screen (main)
│   └── dashboard.js    # Dashboard/analytics screen
├── app.json            # Expo configuration
├── package.json        # Dependencies
├── babel.config.js     # Babel configuration
└── README.md           # This file
```

## 🔗 API Endpoints Used

- `POST /api/study-sessions` - Log new study session
- `GET /api/study-sessions` - Fetch all sessions
- `GET /api/study-recommendations` - Get AI recommendations
- `GET /api/study-predictions` - Get statistical predictions

## 🎨 Styling

All components use React Native's `StyleSheet` API with:
- Modern gradient-inspired colors
- Responsive layouts
- Platform-specific adjustments (iOS/Android)
- Accessibility-friendly touch targets

## 📝 Development Commands

```bash
# Start development server
npm start

# Start with cleared cache
npm start -- --clear

# Run on Android
npm run android

# Run on iOS
npm run ios

# Build for production
npx expo build:android
npx expo build:ios
```

## 🐛 Troubleshooting

### Can't connect to backend
1. Ensure Flask backend is running
2. Check that BASE_URL uses your local IP, not localhost
3. Verify both devices are on the same network
4. Check firewall settings aren't blocking port 5000

### App won't start
1. Clear Expo cache: `npx expo start -c`
2. Delete node_modules and reinstall: `rm -rf node_modules && npm install`
3. Ensure Node.js version is compatible (v16+)

### Validation errors
- Subject: Cannot be empty, max 100 characters
- Duration: 1-1440 minutes
- Focus/Difficulty: 1-5 scale

## 📄 License

Same as the main AI Study Coach project.

## 🤝 Contributing

This is part of the AI Study Coach internship project. See main project README for contribution guidelines.
