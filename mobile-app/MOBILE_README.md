# AI Study Coach - Mobile App Setup

## Overview
This is a React Native mobile application built with Expo for the AI Study Coach platform. The app features a modern UI with login, dashboard with timer, study statistics, and study groups.

## Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Expo Go app on your mobile device (available on iOS App Store and Google Play Store)

## Installation

1. Navigate to the mobile-app directory:
```bash
cd "c:\Users\ACER\Noel\Internship Project\AI Study Coach\mobile-app"
```

2. Install dependencies:
```bash
npm install
```

3. Start the Expo development server:
```bash
npm start
```

## Running on Expo Go

1. After running `npm start`, a QR code will appear in your terminal
2. Open the Expo Go app on your mobile device
3. Scan the QR code:
   - **iOS**: Use the Camera app to scan the QR code
   - **Android**: Use the Expo Go app to scan the QR code
4. The app will load on your device

## Backend Setup

1. Make sure the backend is running:
```bash
cd "c:\Users\ACER\Noel\Internship Project\AI Study Coach\backend"
python app.py
```

2. Find your local IP address:
   - **Windows**: Run `ipconfig` in terminal and look for IPv4 Address
   - **Mac/Linux**: Run `ifconfig` or `ip addr`

3. Update the BASE_URL in the mobile app files:
   - Open [mobile-app/app/dashboard.js](mobile-app/app/dashboard.js)
   - Change `BASE_URL` to `http://YOUR_IP_ADDRESS:5000`
   - Example: `const BASE_URL = 'http://192.168.1.100:5000';`

## App Features

### 1. Login Screen
- Simple email/password authentication
- Clean, modern UI matching the design mockups

### 2. Dashboard
- **Timer**: Start/stop study sessions with a circular timer
- **Statistics**: Visual bar chart showing study patterns
- **Quick Stats**: Today's time, weekly time, most studied subject, best month
- **Study Groups**: View and manage study groups

### 3. Study Groups
- Browse existing study groups
- View group details (members, hours, location)
- Search functionality
- Create new groups (modal)

## Screens Navigation
- `/` - Login Screen
- `/dashboard` - Main Dashboard with timer and stats
- `/groups` - Study Groups list

## Troubleshooting

### Cannot connect to backend
- Ensure your mobile device and computer are on the same WiFi network
- Check that the backend is running on `0.0.0.0:5000` (not `127.0.0.1`)
- Update BASE_URL with your computer's IP address
- Check firewall settings to allow port 5000

### Expo Go issues
- Make sure you're using the latest version of Expo Go
- Clear Expo cache: `expo start -c`
- Restart the development server

### Dependencies not installing
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

## Project Structure
```
mobile-app/
├── app/
│   ├── _layout.js          # Navigation layout
│   ├── index.js            # Login screen
│   ├── dashboard.js        # Main dashboard with timer
│   └── groups.js           # Study groups screen
├── app.json                # Expo configuration
├── package.json            # Dependencies
└── README.md              # This file
```

## Technologies Used
- **React Native**: Mobile framework
- **Expo**: Development platform
- **Expo Router**: File-based routing
- **@expo/vector-icons**: Icon library
- **Axios**: HTTP client (for API calls)

## Design Credits
The UI design follows modern mobile app patterns with:
- Clean, minimalist interface
- Soft color palette (blues, pastels)
- Card-based layouts
- Circular timer design
- Accessible typography

## Next Steps
1. Implement actual authentication with backend
2. Connect timer to study session logging
3. Add real-time statistics updates
4. Implement study group creation and management
5. Add push notifications for study reminders
6. Build for production (iOS/Android)

## Support
For issues or questions, please check the main project documentation or contact the development team.
