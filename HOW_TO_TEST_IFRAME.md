# How to Test Iframe Functionality

## Problem with Current Setup

The `test-iframe-parent.html` file doesn't work properly when opened directly (`file://` protocol) because:
- Cookies don't work properly with `file://` protocol
- CSRF tokens can't be stored in session
- CORS restrictions apply differently

## Solution: Use a Simple HTTP Server

### Option 1: Using Python (Recommended)

1. **Open terminal in project root**
2. **Start a simple HTTP server:**

```bash
# Python 3
python -m http.server 8080

# OR Python 2
python -m SimpleHTTPServer 8080
```

3. **Open browser and navigate to:**
```
http://localhost:8080/test-iframe-parent.html
```

### Option 2: Using Node.js http-server

1. **Install http-server globally (one time):**
```bash
npm install -g http-server
```

2. **Start server in project root:**
```bash
http-server -p 8080
```

3. **Open browser:**
```
http://localhost:8080/test-iframe-parent.html
```

### Option 3: Using VS Code Live Server Extension

1. **Install "Live Server" extension** in VS Code
2. **Right-click** `test-iframe-parent.html`
3. **Select** "Open with Live Server"
4. Browser will open automatically

---

## Complete Testing Steps

### Step 1: Start Backend and Frontend

**Terminal 1 - Backend:**
```bash
cd backend
npm run start:dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
ng serve
```

**Terminal 3 - HTTP Server for test page:**
```bash
# In project root
python -m http.server 8080
```

### Step 2: Open Test Page

Navigate to: `http://localhost:8080/test-iframe-parent.html`

You should see:
- Parent page with controls at the top
- Your Angular app loaded in an iframe below
- Message log at the bottom

### Step 3: Test Login

1. **Inside the iframe**, enter credentials:
   - Email: `test@example.com`
   - Password: `password123`

2. **Click Login**

3. **Check console logs** - you should see:
   ```
   [IframeService] Running inside iframe
   [IframeService] Starting periodic session validation
   [SessionService] Starting session: {...}
   [KeepaliveService] Starting activity monitoring
   ```

### Step 4: Test Parent Communication

1. **Click "Check Session" button** (parent page)
   - Should send message to iframe
   - Iframe should respond with session status
   - Check message log for communication

2. **Click "Send Logout Command"** (parent page)
   - Should trigger logout in iframe
   - User should be redirected to login page

3. **Wait 60 seconds**
   - Automatic session validation should occur
   - Check console for validation messages

### Step 5: Test Session Warning

1. **After login, wait ~30 seconds** (in testing mode)
2. **Session warning dialog should appear**
3. **Click "Stay Logged In"** to extend session
4. **OR wait for auto-logout** at 0:00

---

## Expected Console Output

### On Page Load (Not in Iframe):
```
[IframeService] Not running in iframe
```

### On Page Load (In Iframe):
```
[IframeService] Running inside iframe
[IframeService] Setting up PostMessage listener
[IframeService] Starting periodic session validation
```

### On Login:
```
[SessionService] Starting session: {userId: '...', sessionDuration: '120 seconds', ...}
[KeepaliveService] Starting activity monitoring
[IframeService] Validating session
```

### On Parent "Check Session" Click:
```
[IframeService] Received message from parent: session-check
[IframeService] Sent message to parent: session-valid
```

### On Periodic Validation (every 60s):
```
[IframeService] Validating session
[IframeService] Session is valid
[IframeService] Sent message to parent: session-valid
```

---

## Troubleshooting

### Issue: "CSRF token missing" error

**Cause:** Opening `test-iframe-parent.html` directly with `file://` protocol

**Solution:** Use HTTP server as described above

### Issue: Cookies not working

**Cause:** `file://` protocol doesn't support cookies properly

**Solution:** Use HTTP server (localhost)

### Issue: CORS errors

**Cause:** Backend CORS not configured for test server port

**Solution:** Backend is already configured for `localhost:8080` in `main.ts`

### Issue: Session immediately invalid after login

**Cause:** CSRF token not being sent with requests

**Solution:** 
1. Make sure you're using HTTP server (not `file://`)
2. Check browser console for CSRF errors
3. Verify backend is running on port 3000
4. Verify frontend is running on port 4200

### Issue: Iframe not loading

**Cause:** Security headers blocking embedding

**Solution:** Backend is configured to allow `localhost:8080` in X-Frame-Options

---

## Testing Checklist

- [ ] Backend running on port 3000
- [ ] Frontend running on port 4200
- [ ] HTTP server running on port 8080
- [ ] Test page opened via `http://localhost:8080/test-iframe-parent.html`
- [ ] Can login inside iframe
- [ ] "Check Session" button works
- [ ] "Send Logout" button works
- [ ] Periodic validation occurs every 60s
- [ ] Session warning appears after ~30s
- [ ] Console shows iframe detection logs
- [ ] Message log shows PostMessage communication

---

## Alternative: Test Without Parent Page

If you just want to test the iframe detection without the parent page:

1. **Open browser DevTools** (F12)
2. **Go to Console tab**
3. **Navigate to:** `http://localhost:4200`
4. **Check console output:**
   - Should see: `[IframeService] Not running in iframe`
5. **Now open in iframe:**
   - Navigate to: `http://localhost:8080/test-iframe-parent.html`
   - Should see: `[IframeService] Running inside iframe`

---

## Production Configuration

Before deploying to production:

1. **Update session duration** in `backend/src/common/constants/session.constants.ts`:
   ```typescript
   SESSION_DURATION: 30 * 60 * 1000, // 30 minutes
   ```

2. **Update warning threshold** in `frontend/src/app/core/services/session.service.ts`:
   ```typescript
   private readonly WARNING_THRESHOLD = 5 * 60 * 1000; // 5 minutes
   ```

3. **Update allowed origins** in `backend/src/main.ts`:
   ```typescript
   const allowedOrigins = [
     'https://your-production-domain.com',
     'https://parent-app-domain.com',
   ];
   ```

4. **Update CSP frame-ancestors** in `backend/src/main.ts`:
   ```typescript
   directives: {
     frameAncestors: ["'self'", 'https://parent-app-domain.com'],
   }
   ```

---

Made with Bob 🤖