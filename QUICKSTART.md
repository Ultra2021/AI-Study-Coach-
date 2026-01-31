# 🚀 Quick Start Guide - AI Study Coach Mobile App

## Step 1: Install Dependencies

### Mobile App Dependencies
Open PowerShell in the mobile-app directory:
```powershell
cd "c:\Users\ACER\Noel\Internship Project\AI Study Coach\mobile-app"
npm install --legacy-peer-deps
```
⏱️ This may take 2-3 minutes. Wait for completion.

**Note:** We use `--legacy-peer-deps` to handle peer dependency conflicts.

### Backend Dependencies (if not already done)
```powershell
cd "c:\Users\ACER\Noel\Internship Project\AI Study Coach\backend"
pip install -r requirements.txt
```

---

## Step 2: Configure Backend Connection

### 2.1 Find Your IP Address
Run this command in PowerShell:
```powershell
ipconfig
```

**Look for:** "IPv4 Address" under your WiFi or Ethernet adapter
- Example: `192.168.1.100`
- Usually starts with `192.168.x.x` or `10.0.x.x`

### 2.2 Update Configuration
1. Open `mobile-app\config.js`
2. Find this line:
   ```javascript
   BASE_URL: 'http://192.168.1.71:5000',
   ```
3. Replace with YOUR IP address:
   ```javascript
   BASE_URL: 'http://YOUR_IP_ADDRESS:5000',
   ```
4. **Example:**
   ```javascript
   BASE_URL: 'http://192.168.1.100:5000',
   ```
5. **Save the file**

---

## Step 3: Start Backend Server

Open PowerShell (Terminal #1):
```powershell
cd "c:\Users\ACER\Noel\Internship Project\AI Study Coach\backend"
python app.py
```

**✅ Success looks like:**
```
 * Running on http://0.0.0.0:5000
 * Restarting with stat
```

**⚠️ Keep this terminal window open!**

---

## Step 4: Start Mobile App

Open a NEW PowerShell window (Terminal #2):
```powershell
cd "c:\Users\ACER\Noel\Internship Project\AI Study Coach\mobile-app"
npm start
```

**✅ Success looks like:**
- QR code appears in terminal
- Browser opens with Expo Dev Tools
- Message: "Metro waiting on exp://..."

**⚠️ Keep this terminal window open too!**

---

## Step 5: Run on Your Phone

### 5.1 Install Expo Go
- **iPhone**: Download from App Store
- **Android**: Download from Google Play Store
- Search: "Expo Go"

### 5.2 Connect Your Phone
**IMPORTANT:** Make sure your phone and computer are on the **SAME WiFi network**!

### 5.3 Open the App

#### Option A: Scan QR Code (Recommended)
1. Open **Expo Go** app on your phone
2. Tap **"Scan QR code"**
3. Point camera at the QR code in your terminal
4. Wait for app to load (30-60 seconds first time)

#### Option B: Enter URL Manually
1. Open **Expo Go** app
2. Tap **"Enter URL manually"**
3. Type: `exp://YOUR_IP_ADDRESS:8081`
   - Replace YOUR_IP_ADDRESS with your actual IP
   - Example: `exp://192.168.1.100:8081`
4. Tap **"Connect"**

---

## Step 6: Test the App

### Login Screen Should Appear:
- ✅ White background
- ✅ "Login" title
- ✅ Email input field with mail icon
- ✅ Password input field with lock icon
- ✅ Red "LOGIN" button

### Try Logging In:
1. Enter any email (e.g., `test@test.com`)
2. Enter any password (e.g., `test123`)
3. Tap **"LOGIN"**
4. Should navigate to Dashboard ✨

### Dashboard Features:
- Timer showing 00:00
- Statistics section with bar charts
- Quick stats cards
- "Start Studying" button
- Study groups section

---

## 🎉 You're Done!

If you see the login screen, everything is working correctly!

---

## 🐛 Troubleshooting

### ❌ Problem: "Network request failed"
**Cause:** App can't connect to backend

**Solutions:**
1. ✅ Check backend is running (Terminal #1 should show "Running on...")
2. ✅ Verify phone and computer on **same WiFi network**
3. ✅ Check `config.js` has correct IP address
4. ✅ Test in phone browser: visit `http://YOUR_IP:5000`
5. ✅ Check Windows Firewall:
   ```powershell
   # Run as Administrator
   New-NetFirewallRule -DisplayName "AI Study Coach" -Direction Inbound -Protocol TCP -LocalPort 5000 -Action Allow
   ```

---

### ❌ Problem: "Unable to resolve module"
**Cause:** Missing dependencies

**Solution:**
```powershell
cd mobile-app
Remove-Item node_modules -Recurse -Force
npm cache clean --force
npm install --legacy-peer-deps
```

---

### ❌ Problem: Can't scan QR code
**Cause:** Camera issues or QR code not clear

**Solutions:**
1. ✅ Make QR code larger (zoom terminal window)
2. ✅ Use "Enter URL manually" instead
3. ✅ Update Expo Go app to latest version
4. ✅ Try restarting: Press `Ctrl+C` then `npm start` again

---

### ❌ Problem: White screen on phone
**Cause:** App loaded but showing blank

**Solutions:**
1. ✅ Wait 30 seconds (first load is slow)
2. ✅ Shake phone → tap "Reload"
3. ✅ Clear cache:
   ```powershell
   npx expo start -c
   ```
4. ✅ Check for error messages (red box on phone)

---

### ❌ Problem: Backend won't start (Port 5000 in use)
**Cause:** Another program using port 5000

**Solutions:**
```powershell
# Kill Python processes
Get-Process python | Stop-Process -Force

# Then try starting backend again
python app.py
```

---

### ❌ Problem: "Metro bundler error"
**Cause:** Expo cache issue

**Solution:**
```powershell
# Clear cache and restart
npx expo start -c
```

---

## 🔍 Quick Verification

Run this command to verify all files:
```powershell
cd "c:\Users\ACER\Noel\Internship Project\AI Study Coach"
.\check.ps1
```

You should see all green checkmarks ✅

---

## 📱 Demo Login

For testing, use any credentials:
- **Email:** `test@test.com` (must include @)
- **Password:** `anything`

The app uses simple validation for demo purposes.

---

## 🎯 Next Steps After Setup

1. **Start a study session:**
   - Tap "Start Studying" on dashboard
   - Timer begins counting
   - Tap play/pause to control

2. **View statistics:**
   - See study patterns in bar chart
   - Check quick stats cards

3. **Browse study groups:**
   - Scroll to Study Groups section
   - View group details
   - Use search functionality

---

## 💡 Pro Tips

### Keep Terminals Open
- Don't close the backend terminal (Terminal #1)
- Don't close the Expo terminal (Terminal #2)
- Both must run simultaneously

### Reload App
- **iOS:** Shake device → tap "Reload"
- **Android:** Shake device → tap "Reload"
- Or: Press `R` in the Expo terminal

### Debug Menu
- Shake your phone to open debug menu
- Useful options:
  - Reload
  - Enable/Disable Fast Refresh
  - Show Performance Monitor

### Stop Everything
```powershell
# In each terminal window, press:
Ctrl + C
```

---

## 📚 Additional Resources

- **Full Documentation:** See `README.md`
- **Mobile Details:** See `mobile-app\MOBILE_README.md`
- **Changes Made:** See `MIGRATION_SUMMARY.md`
- **Architecture:** See `ARCHITECTURE.md`
- **Startup Checklist:** See `STARTUP_CHECKLIST.md`

---

## ✅ Success Checklist

Before asking for help, verify:
- [ ] npm install completed successfully
- [ ] Backend running on port 5000
- [ ] config.js updated with correct IP
- [ ] Phone and computer on same WiFi
- [ ] Expo Go installed on phone
- [ ] QR code scanned or URL entered
- [ ] Login screen visible on phone

---

## 🆘 Still Having Issues?

1. Run the diagnostic: `.\check.ps1`
2. Check terminal output for errors
3. Verify firewall settings
4. Restart both terminals
5. Restart your phone

---

## 🎊 Enjoy Your AI Study Coach!

Once everything is running:
- Log your study sessions
- Track your progress
- View personalized recommendations
- Join study groups
- Improve your learning habits

**Happy Studying! 📚📱✨**
