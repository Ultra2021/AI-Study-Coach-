# ✅ AI Study Coach Mobile App - Startup Checklist

Use this checklist to ensure everything is set up correctly before running the app.

## 📋 Pre-Flight Checklist

### ☐ 1. Prerequisites Installed
- [ ] Node.js installed (check: `node --version`)
- [ ] npm installed (check: `npm --version`)
- [ ] Python 3.7+ installed (check: `python --version`)
- [ ] Expo Go app installed on your mobile device
- [ ] Phone and computer on the **same WiFi network**

### ☐ 2. Backend Setup
- [ ] Navigate to backend directory: `cd backend`
- [ ] Install Python dependencies: `pip install -r requirements.txt`
- [ ] Verify Flask is installed: `pip show flask`

### ☐ 3. Mobile App Setup
- [ ] Navigate to mobile-app directory: `cd mobile-app`
- [ ] Install npm dependencies: `npm install`
- [ ] Wait for installation to complete (may take a few minutes)
- [ ] Verify installation: `node_modules` folder should exist

### ☐ 4. Network Configuration
- [ ] Find your IP address:
  - **Windows**: Run `ipconfig` → Look for "IPv4 Address"
  - **Example**: 192.168.1.100
- [ ] Open `mobile-app/config.js`
- [ ] Update BASE_URL line:
  ```javascript
  BASE_URL: 'http://YOUR_IP_ADDRESS:5000',
  ```
  - **Replace YOUR_IP_ADDRESS with your actual IP**
  - **Example**: `BASE_URL: 'http://192.168.1.100:5000',`
- [ ] Save the file

### ☐ 5. Firewall Configuration (Windows)
- [ ] Allow Python through Windows Firewall
- [ ] Allow port 5000 connections
- [ ] OR temporarily disable firewall for testing

## 🚀 Launch Sequence

### Step 1: Start Backend Server
```powershell
# Open PowerShell window #1
cd "c:\Users\ACER\Noel\Internship Project\AI Study Coach\backend"
python app.py
```

**Expected Output:**
```
 * Running on http://0.0.0.0:5000
 * Restarting with stat
```

✅ **Backend is ready when you see**: "Running on http://0.0.0.0:5000"

---

### Step 2: Start Mobile App
```powershell
# Open PowerShell window #2
cd "c:\Users\ACER\Noel\Internship Project\AI Study Coach\mobile-app"
npm start
```

**Expected Output:**
- Expo Dev Tools will open in your browser
- QR code will appear in terminal
- Options to run on Android/iOS

✅ **Mobile app is ready when you see**: QR code in terminal

---

### Step 3: Run on Your Phone

**Option A: Scan QR Code (Recommended)**
1. [ ] Open Expo Go app on your phone
2. [ ] Tap "Scan QR code"
3. [ ] Scan the QR code from your terminal
4. [ ] Wait for app to load (may take 1-2 minutes first time)

**Option B: Enter URL Manually**
1. [ ] Open Expo Go app
2. [ ] Tap "Enter URL manually"
3. [ ] Type: `exp://YOUR_IP_ADDRESS:8081`
4. [ ] Tap "Connect"

---

## ✅ Success Indicators

### Backend Running Successfully:
- ✅ Terminal shows: "Running on http://0.0.0.0:5000"
- ✅ No error messages
- ✅ Can visit http://localhost:5000 in browser

### Mobile App Running Successfully:
- ✅ QR code visible in terminal
- ✅ Expo Dev Tools open in browser
- ✅ No red error messages

### App Loaded on Phone:
- ✅ Login screen appears
- ✅ Can type in email/password fields
- ✅ No "Network request failed" errors
- ✅ Can navigate to dashboard after login

---

## 🎯 Quick Test

After the app loads on your phone:

1. [ ] **Login Screen Loads**
   - White background with "Login" title
   - Email and password input fields with icons
   - Red "LOGIN" button

2. [ ] **Can Login**
   - Enter any email (e.g., `test@test.com`)
   - Enter any password (e.g., `test123`)
   - Tap "LOGIN" button
   - Should navigate to dashboard

3. [ ] **Dashboard Works**
   - See greeting with "Hello Carolina!"
   - See timer showing 00:00
   - See statistics section
   - See quick stats cards
   - Can scroll through the page

4. [ ] **Timer Functions**
   - Tap "Start Studying" button
   - Timer should start counting
   - Tap play/pause button to control timer

---

## 🐛 Troubleshooting

### ❌ "Network request failed"
**Problem**: App can't reach backend

**Solutions**:
- [ ] Verify backend is running (check PowerShell window #1)
- [ ] Check phone and computer are on **same WiFi**
- [ ] Verify config.js has correct IP address
- [ ] Test backend: visit `http://YOUR_IP:5000` in phone browser
- [ ] Check Windows Firewall allows port 5000

---

### ❌ "Unable to resolve module"
**Problem**: Missing dependencies

**Solution**:
```powershell
cd mobile-app
Remove-Item node_modules -Recurse -Force
npm cache clean --force
npm install
```

---

### ❌ QR code won't scan
**Problem**: Camera can't read QR code

**Solutions**:
- [ ] Make sure QR code is fully visible on screen
- [ ] Try "Enter URL manually" instead
- [ ] Update Expo Go app to latest version
- [ ] Restart Expo: `npm start` again

---

### ❌ Backend won't start
**Problem**: Port 5000 already in use

**Solutions**:
- [ ] Close other programs using port 5000
- [ ] Kill Python processes: 
  ```powershell
  Get-Process python | Stop-Process -Force
  ```
- [ ] Restart your computer

---

### ❌ White screen on phone
**Problem**: App loaded but showing blank screen

**Solutions**:
- [ ] Wait 30 seconds (first load can be slow)
- [ ] Shake phone → tap "Reload"
- [ ] Clear cache: `npx expo start -c`
- [ ] Check for red error box on phone screen

---

## 📱 Alternative: Use Helper Script

Instead of manual steps, use the helper script:

```powershell
cd "c:\Users\ACER\Noel\Internship Project\AI Study Coach"
.\run.ps1
```

The script will:
- Show your IP address
- Help install dependencies
- Start backend or mobile app
- Open config file for editing

---

## 🎉 You're Ready!

If you've completed all checkboxes above, you're ready to use the AI Study Coach mobile app!

### Final Checklist:
- [ ] Backend running (http://0.0.0.0:5000)
- [ ] Mobile app running (QR code visible)
- [ ] config.js updated with correct IP
- [ ] App loaded on phone via Expo Go
- [ ] Login screen visible and functional
- [ ] Can navigate to dashboard

**Happy Studying! 📚📱**

---

## 💡 Tips

- Keep both PowerShell windows open while using the app
- Backend window shows API requests in real-time
- Mobile app window shows Expo logs
- Shake phone for debug menu
- Press Ctrl+C in terminal to stop servers

## 📚 Additional Resources

- **Quick Setup**: See [QUICKSTART.md](QUICKSTART.md)
- **Mobile Documentation**: See [mobile-app/MOBILE_README.md](mobile-app/MOBILE_README.md)
- **Main Documentation**: See [README.md](README.md)
- **Changes Made**: See [MIGRATION_SUMMARY.md](MIGRATION_SUMMARY.md)
