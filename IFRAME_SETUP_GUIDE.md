# 🖼️ Iframe Setup & Testing Guide

Complete guide for running and testing the Angular authentication app inside an iframe.

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Prerequisites](#prerequisites)
3. [Step-by-Step Setup](#step-by-step-setup)
4. [Testing the Iframe](#testing-the-iframe)
5. [Understanding the Logs](#understanding-the-logs)
6. [Troubleshooting](#troubleshooting)
7. [Production Deployment](#production-deployment)

---

## 🚀 Quick Start

**TL;DR - Run these 3 commands in separate terminals:**

```bash
# Terminal 1: Backend
cd backend && npm run start:dev

# Terminal 2: Frontend  
cd frontend && ng serve

# Terminal 3: Test Server
python -m http.server 8080
```

**Then open:** `http://localhost:8080/test-iframe-parent.html`

---

## ✅ Prerequisites

Before starting, ensure you have:

- ✅ Node.js installed (v16 or higher)
- ✅ Python installed (for HTTP server)
- ✅ Redis running (for sessions)
- ✅ PostgreSQL running (for database)
- ✅ All dependencies installed (`npm install` in both backend and frontend)

### Check Redis is Running

```bash
# Windows
redis-cli ping
# Should return: PONG

# Linux/Mac
redis-server --version
```

### Check PostgreSQL is Running

```bash
# Check if database exists
psql -U postgres -l | grep boblogin
```

---

## 📝 Step-by-Step Setup

### Step 1: Start the Backend

Open **Terminal 1** and run:

```bash
cd backend
npm run start:dev
```

**Expected output:**
```
[Nest] 12345  - 05/25/2026, 2:00:00 PM     LOG [NestFactory] Starting Nest application...
[Nest] 12345  - 05/25/2026, 2:00:01 PM     LOG [InstanceLoader] AppModule dependencies initialized
[Nest] 12345  - 05/25/2026, 2:00:01 PM     LOG [RoutesResolver] AuthController {/auth}:
[Nest] 12345  - 05/25/2026, 2:00:01 PM     LOG [RouterExplorer] Mapped {/auth/login, POST} route
[Nest] 12345  - 05/25/2026, 2:00:01 PM     LOG [RouterExplorer] Mapped {/auth/logout, POST} route
[Nest] 12345  - 05/25/2026, 2:00:01 PM     LOG [NestApplication] Nest application successfully started
[Nest] 12345  - 05/25/2026, 2:00:01 PM     LOG Application is running on: http://localhost:3000
```

**Verify backend is running:**
```bash
curl http://localhost:3000/auth/csrf
# Should return: {"csrfToken":"..."}
```

---

### Step 2: Start the Frontend

Open **Terminal 2** and run:

```bash
cd frontend
ng serve
```

**Expected output:**
```
✔ Browser application bundle generation complete.

Initial Chunk Files   | Names         |  Raw Size
main.js               | main          |   2.5 MB | 
styles.css            | styles        |  50.2 kB | 

                      | Initial Total |   2.5 MB

Application bundle generation complete. [5.234 seconds]

Watch mode enabled. Watching for file changes...
  ➜  Local:   http://localhost:4200/
```

**Verify frontend is running:**
Open browser to `http://localhost:4200` - you should see the login page.

---

### Step 3: Start the HTTP Server for Test Page

Open **Terminal 3** in the **project root** (not backend or frontend folder):

```bash
# Make sure you're in the project root
cd /path/to/bobLogin

# Start HTTP server
python -m http.server 8080
```

**Expected output:**
```
Serving HTTP on 0.0.0.0 port 8080 (http://0.0.0.0:8080/) ...
```

**Alternative options:**

**Option A: Using Node.js http-server**
```bash
# Install globally (one time)
npm install -g http-server

# Run server
http-server -p 8080
```

**Option B: Using VS Code Live Server**
1. Install "Live Server" extension
2. Right-click `test-iframe-parent.html`
3. Select "Open with Live Server"

---

### Step 4: Open the Test Page

**Open your browser and navigate to:**
```
http://localhost:8080/test-iframe-parent.html
```

**⚠️ IMPORTANT:** Do NOT open the file directly (file:///...). This will cause CSRF errors!

**What you should see:**

```
┌─────────────────────────────────────────────────────────┐
│  🖼️ Parent Page - Iframe Session Test                   │
│                                                          │
│  Parent Controls:                                        │
│  [Check Session] [Send Logout] [Clear Log] [Reload]    │
├─────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────┐ │
│  │                                                    │ │
│  │         Angular Login Page (in iframe)            │ │
│  │                                                    │ │
│  │         Email: [                    ]             │ │
│  │         Password: [                 ]             │ │
│  │         [Login]                                   │ │
│  │                                                    │ │
│  └────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│  Message Log:                                            │
│  📱 Iframe loaded successfully                           │
└─────────────────────────────────────────────────────────┘
```

---

## 🧪 Testing the Iframe

### Test 1: Login Inside Iframe

1. **Inside the iframe**, enter credentials:
   - Email: `test@example.com`
   - Password: `password123`

2. **Click the Login button**

3. **Check browser console** (F12 → Console tab):
   ```
   ✅ [IframeService] Running inside iframe
   ✅ [IframeService] Setting up PostMessage listener
   ✅ [IframeService] Starting periodic session validation
   ✅ [SessionService] Starting session: {userId: '...', sessionDuration: '120 seconds', ...}
   ✅ [KeepaliveService] Starting activity monitoring
   ```

4. **Check message log** on parent page:
   ```
   📱 Iframe loaded successfully
   ✅ Session is valid
   ```

5. **You should be redirected** to the dashboard inside the iframe

---

### Test 2: Parent-to-Iframe Communication

1. **Click "Check Session" button** on parent page

2. **Check message log:**
   ```
   📤 Sent to iframe: {"type":"session-check","timestamp":1234567890}
   📥 Received from iframe: {"type":"session-valid","timestamp":1234567890}
   ✅ Session is valid
   ```

3. **Check browser console:**
   ```
   [IframeService] Received message from parent: session-check
   [IframeService] Sent message to parent: session-valid
   ```

---

### Test 3: Parent-Controlled Logout

1. **Make sure you're logged in** (see Test 1)

2. **Click "Send Logout Command"** on parent page

3. **Observe the iframe:**
   - User should be logged out
   - Redirected to login page

4. **Check message log:**
   ```
   📤 Sent to iframe: {"type":"logout","timestamp":1234567890}
   ✅ Logout command sent
   ```

5. **Check browser console:**
   ```
   [IframeService] Received message from parent: logout
   [IframeService] Logging out user
   [AuthService] Logging out...
   ```

---

### Test 4: Automatic Session Validation

1. **Login** (see Test 1)

2. **Wait 60 seconds** without clicking anything

3. **Check browser console** - you should see:
   ```
   [IframeService] Validating session
   [IframeService] Session is valid
   [IframeService] Sent message to parent: session-valid
   ```

4. **Check message log** - new entry every 60 seconds:
   ```
   📥 Received from iframe: {"type":"session-valid","timestamp":1234567890}
   ✅ Session is valid
   ```

---

### Test 5: Session Warning Dialog

1. **Login** (see Test 1)

2. **Wait approximately 30 seconds** (in testing mode)

3. **Session warning dialog should appear:**
   ```
   ⚠️ Session Expiring Soon
   
   Your session will expire in 00:30
   
   [Stay Logged In]  [Logout Now]
   ```

4. **Test "Stay Logged In" button:**
   - Click the button
   - Dialog should close
   - Session should be extended
   - Check console: `[SessionService] Session extended`

5. **Test auto-logout:**
   - Let the timer reach 0:00
   - User should be automatically logged out
   - Redirected to login page

---

### Test 6: Activity-Based Keepalive

1. **Login** (see Test 1)

2. **Move your mouse** or **click** inside the iframe

3. **Check browser console:**
   ```
   [KeepaliveService] Activity detected: mousemove
   [KeepaliveService] Sending keepalive request
   [KeepaliveService] Keepalive successful, session extended
   ```

4. **Wait 60 seconds** without any activity

5. **Do another activity** (move mouse)

6. **Verify** keepalive request is sent (check console)

---

### Test 7: Reload Iframe

1. **Login** (see Test 1)

2. **Click "Reload Iframe" button** on parent page

3. **Observe:**
   - Iframe reloads
   - Session should persist (you stay logged in)
   - Dashboard should appear (not login page)

4. **Check browser console:**
   ```
   [IframeService] Running inside iframe
   [SessionService] Checking existing session
   [SessionService] Session found, user authenticated
   ```

---

### Test 8: Cross-Tab Synchronization

1. **Login** in the iframe

2. **Open a new tab** and navigate to: `http://localhost:4200`

3. **In the new tab**, logout

4. **Go back to the iframe tab**

5. **Observe:**
   - Iframe should automatically logout
   - Redirected to login page

6. **Check browser console:**
   ```
   [BroadcastService] Received message: logout
   [AuthService] Logging out due to cross-tab event
   ```

---

## 📊 Understanding the Logs

### Console Log Types

**Iframe Detection:**
```javascript
[IframeService] Running inside iframe
[IframeService] Not running in iframe
```

**Session Management:**
```javascript
[SessionService] Starting session: {...}
[SessionService] Session extended
[SessionService] Session expired
```

**Activity Monitoring:**
```javascript
[KeepaliveService] Starting activity monitoring
[KeepaliveService] Activity detected: mousemove
[KeepaliveService] Sending keepalive request
```

**PostMessage Communication:**
```javascript
[IframeService] Received message from parent: session-check
[IframeService] Sent message to parent: session-valid
```

**Cross-Tab Events:**
```javascript
[BroadcastService] Sending message: logout
[BroadcastService] Received message: session-extended
```

---

### Message Log Entries

**Parent → Iframe:**
```
📤 Sent to iframe: {"type":"session-check","timestamp":1234567890}
📤 Sent to iframe: {"type":"logout","timestamp":1234567890}
```

**Iframe → Parent:**
```
📥 Received from iframe: {"type":"session-valid","timestamp":1234567890}
📥 Received from iframe: {"type":"session-invalid","timestamp":1234567890}
📥 Received from iframe: {"type":"session-extended","timestamp":1234567890}
```

**Status Messages:**
```
✅ Session is valid
❌ Session is invalid
⚠️ Session warning
🔄 Iframe reloaded
```

---

## 🔧 Troubleshooting

### Issue: "CSRF token missing" Error

**Symptoms:**
```
❌ POST http://localhost:4200/api/auth/logout 403 (Forbidden)
❌ Access forbidden: CSRF token missing
```

**Cause:** Opening test page with `file://` protocol

**Solution:**
1. Close the browser tab
2. Make sure HTTP server is running: `python -m http.server 8080`
3. Open: `http://localhost:8080/test-iframe-parent.html` (not file:///)

---

### Issue: Iframe Not Loading

**Symptoms:**
- Blank iframe
- "Refused to display in a frame" error

**Cause:** Security headers blocking embedding

**Solution:**
1. Check backend is running on port 3000
2. Verify `backend/src/main.ts` has correct allowed origins:
   ```typescript
   const allowedOrigins = [
     'http://localhost:8080',
     'http://127.0.0.1:8080',
   ];
   ```

---

### Issue: Session Immediately Invalid After Login

**Symptoms:**
```
[IframeService] Session invalid, logging out
❌ Session is invalid
```

**Cause:** CSRF token not being sent with requests

**Solution:**
1. Clear browser cookies and cache
2. Restart backend server
3. Make sure you're using `http://localhost:8080` (not `file://`)
4. Check browser console for CSRF errors

---

### Issue: Cookies Not Working

**Symptoms:**
- Can't stay logged in
- Session lost on page reload

**Cause:** Using `file://` protocol or incorrect domain

**Solution:**
1. Use HTTP server: `python -m http.server 8080`
2. Access via: `http://localhost:8080/test-iframe-parent.html`
3. Check browser cookie settings (allow cookies for localhost)

---

### Issue: CORS Errors

**Symptoms:**
```
❌ Access to XMLHttpRequest blocked by CORS policy
```

**Cause:** Backend CORS not configured for test server port

**Solution:**
1. Check `backend/src/main.ts` CORS configuration:
   ```typescript
   app.enableCors({
     origin: ['http://localhost:4200', 'http://localhost:8080'],
     credentials: true,
   });
   ```
2. Restart backend server

---

### Issue: PostMessage Not Working

**Symptoms:**
- "Check Session" button does nothing
- No messages in log

**Cause:** Origin validation failing

**Solution:**
1. Check browser console for errors
2. Verify `frontend/src/app/core/services/iframe.service.ts` has correct allowed origins:
   ```typescript
   private readonly ALLOWED_ORIGINS = [
     'http://localhost:8080',
     'http://127.0.0.1:8080',
   ];
   ```

---

### Issue: Redis Connection Error

**Symptoms:**
```
[Nest] ERROR [RedisModule] Could not connect to Redis
```

**Cause:** Redis server not running

**Solution:**
```bash
# Windows
redis-server

# Linux/Mac
sudo service redis-server start

# Docker
docker run -d -p 6379:6379 redis
```

---

### Issue: Database Connection Error

**Symptoms:**
```
[Nest] ERROR [TypeOrmModule] Unable to connect to the database
```

**Cause:** PostgreSQL not running or wrong credentials

**Solution:**
1. Check PostgreSQL is running
2. Verify `backend/.env` has correct database credentials:
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=your_password
   DB_DATABASE=boblogin
   ```
3. Create database if it doesn't exist:
   ```bash
   psql -U postgres -c "CREATE DATABASE boblogin;"
   ```

---

## 🚀 Production Deployment

### Step 1: Update Session Duration

**File:** `backend/src/common/constants/session.constants.ts`

```typescript
export const SESSION_CONSTANTS = {
  // Change from 2 minutes (testing) to 30 minutes (production)
  SESSION_DURATION: 30 * 60 * 1000, // 30 minutes
  
  // Change from 30 seconds (testing) to 5 minutes (production)
  WARNING_THRESHOLD: 5 * 60 * 1000, // 5 minutes before expiry
};
```

---

### Step 2: Update Allowed Origins

**File:** `backend/src/main.ts`

```typescript
// Replace localhost with your production domains
const allowedOrigins = [
  'https://your-app.com',
  'https://parent-app.com',
];

// Update CORS
app.enableCors({
  origin: allowedOrigins,
  credentials: true,
});

// Update CSP
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        frameAncestors: ["'self'", 'https://parent-app.com'],
      },
    },
  }),
);

// Update X-Frame-Options
app.use((req, res, next) => {
  const origin = req.get('origin');
  if (allowedOrigins.includes(origin)) {
    res.setHeader('X-Frame-Options', `ALLOW-FROM ${origin}`);
  }
  next();
});
```

---

### Step 3: Update Frontend Environment

**File:** `frontend/src/environments/environment.prod.ts`

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.your-app.com',
};
```

---

### Step 4: Update Iframe Service Origins

**File:** `frontend/src/app/core/services/iframe.service.ts`

```typescript
private readonly ALLOWED_ORIGINS = [
  'https://parent-app.com',
  'https://another-parent.com',
];
```

---

### Step 5: Build for Production

```bash
# Build frontend
cd frontend
ng build --configuration production

# Build backend
cd backend
npm run build
```

---

### Step 6: Deploy

**Frontend:** Deploy `frontend/dist` to your web server or CDN

**Backend:** Deploy `backend/dist` to your Node.js server

**Environment Variables:** Set production values in your hosting environment

---

## 📚 Additional Resources

- **Main README:** `README.md` - Project overview
- **How to Run:** `HOW_TO_RUN.md` - General setup guide
- **Phase 9 Docs:** `PHASE_9_IMPLEMENTATION.md` - Iframe implementation details
- **Testing Guide:** `TESTING_GUIDE.md` - Comprehensive testing scenarios

---

## ✅ Testing Checklist

Use this checklist to verify everything works:

- [ ] Backend running on port 3000
- [ ] Frontend running on port 4200
- [ ] HTTP server running on port 8080
- [ ] Test page opens at `http://localhost:8080/test-iframe-parent.html`
- [ ] Can login inside iframe (test@example.com / password123)
- [ ] Console shows: `[IframeService] Running inside iframe`
- [ ] "Check Session" button sends/receives messages
- [ ] "Send Logout" button triggers logout in iframe
- [ ] Periodic validation occurs every 60 seconds
- [ ] Session warning appears after ~30 seconds
- [ ] "Stay Logged In" button extends session
- [ ] Auto-logout works when timer reaches 0:00
- [ ] Activity (mouse move) triggers keepalive
- [ ] Iframe reload preserves session
- [ ] Cross-tab logout synchronizes
- [ ] Message log shows all communications
- [ ] No CSRF errors in console
- [ ] No CORS errors in console

---

**Made with Bob 🤖**

Last updated: May 25, 2026