# Complete Testing Guide - Authentication System

## Table of Contents
1. [Phase 8: Session Keepalive & Warning Testing](#phase-8-session-keepalive--warning-testing)
2. [Phase 9: Iframe Session Validation Testing](#phase-9-iframe-session-validation-testing)
3. [Testing Tools & Setup](#testing-tools--setup)
4. [Common Issues & Solutions](#common-issues--solutions)

---

## Phase 8: Session Keepalive & Warning Testing

### Prerequisites
- Backend running on `http://localhost:3000`
- Frontend running on `http://localhost:4200`
- Redis running and accessible
- Browser DevTools open (F12)

### Test Scenario 1: Session Warning Dialog Appears

**Objective:** Verify warning dialog appears at the correct time.

**Steps:**
1. Open browser to `http://localhost:4200`
2. Login with valid credentials (test@example.com / password123)
3. Open Browser DevTools → Console tab
4. Wait approximately 30 seconds (with current 2-minute session, 90-second warning)
5. Observe console logs and UI

**Expected Results:**
- ✅ Console shows: `[SessionService] ⚠️ SHOWING WARNING DIALOG`
- ✅ Warning dialog appears on screen
- ✅ Dialog shows countdown timer (e.g., "1:30")
- ✅ Timer updates every second
- ✅ Two buttons visible: "Stay Logged In" and "Logout Now"

**Pass Criteria:** Dialog appears within 5 seconds of expected time.

---

### Test Scenario 2: Countdown Timer Accuracy

**Objective:** Verify countdown timer displays and updates correctly.

**Steps:**
1. Wait for warning dialog to appear (from Scenario 1)
2. Watch the countdown timer for 10 seconds
3. Note the time format and update frequency

**Expected Results:**
- ✅ Timer displays in MM:SS format (e.g., "1:30", "1:29", "1:28")
- ✅ Timer updates every second
- ✅ Timer counts down continuously
- ✅ No skipped seconds or freezing

**Pass Criteria:** Timer updates smoothly every second without errors.

---

### Test Scenario 3: "Stay Logged In" Button

**Objective:** Verify session extension works correctly.

**Steps:**
1. Wait for warning dialog to appear
2. Click "Stay Logged In" button
3. Observe console and UI
4. Check Network tab for keepalive request

**Expected Results:**
- ✅ Dialog closes immediately
- ✅ Console shows: `[SessionWarningDialog] Extending session`
- ✅ Network tab shows POST to `/auth/keepalive`
- ✅ Response status: 200 OK
- ✅ Session extended to 2 minutes from now
- ✅ Warning will appear again in ~30 seconds

**Pass Criteria:** Dialog closes, session extended, no errors.

---

### Test Scenario 4: "Logout Now" Button

**Objective:** Verify manual logout works correctly.

**Steps:**
1. Login again
2. Wait for warning dialog to appear
3. Click "Logout Now" button
4. Observe console and navigation

**Expected Results:**
- ✅ Console shows: `[SessionWarningDialog] Manual logout`
- ✅ Dialog closes immediately
- ✅ Network tab shows POST to `/auth/logout`
- ✅ Redirected to login page
- ✅ Session cleared

**Pass Criteria:** User logged out and redirected to login page.

---

### Test Scenario 5: Auto-Logout at 0:00

**Objective:** Verify automatic logout when timer expires.

**Steps:**
1. Login again
2. Wait for warning dialog to appear
3. Do NOT click any buttons
4. Watch countdown reach 0:00
5. Observe what happens

**Expected Results:**
- ✅ Timer counts down to 0:00
- ✅ Console shows: `[SessionWarningDialog] Time expired, auto-logout`
- ✅ Console shows: `[SessionService] 🚪 SESSION EXPIRED - Auto logout`
- ✅ User automatically logged out
- ✅ Redirected to login page

**Pass Criteria:** Auto-logout occurs at 0:00 without user action.

---

### Test Scenario 6: Keyboard Shortcuts

**Objective:** Verify keyboard shortcuts work correctly.

**Steps:**
1. Login again
2. Wait for warning dialog to appear
3. Press `Enter` key
4. Verify session extended
5. Wait for dialog again
6. Press `Escape` key
7. Verify logout

**Expected Results:**
- ✅ `Enter` key extends session (same as "Stay Logged In")
- ✅ `Escape` key logs out (same as "Logout Now")
- ✅ No page refresh or errors

**Pass Criteria:** Both keyboard shortcuts work as expected.

---

### Test Scenario 7: Activity Detection & Keepalive

**Objective:** Verify user activity triggers keepalive requests.

**Steps:**
1. Login to the application
2. Open DevTools → Network tab
3. Filter by "keepalive"
4. Perform various activities:
   - Move mouse around
   - Click on different areas
   - Type in any input field
   - Scroll the page
5. Wait 2 seconds after activity stops
6. Observe Network tab

**Expected Results:**
- ✅ Console shows: `[KeepaliveService] Activity detected, sending keepalive`
- ✅ Network tab shows POST to `/auth/keepalive`
- ✅ Request sent ~2 seconds after activity stops (debounce)
- ✅ Maximum 1 request per minute (throttle)
- ✅ Response: `{ message: 'Session extended', expiresAt: <timestamp> }`

**Pass Criteria:** Keepalive requests sent on activity, throttled to 1/minute.

---

### Test Scenario 8: Cross-Tab Synchronization

**Objective:** Verify session state syncs across browser tabs.

**Steps:**
1. Open Tab 1: Login to `http://localhost:4200`
2. Open Tab 2: Navigate to `http://localhost:4200` (should auto-login)
3. In Tab 1: Wait for warning dialog
4. In Tab 1: Click "Stay Logged In"
5. Observe Tab 2
6. In Tab 1: Wait for warning again
7. In Tab 1: Click "Logout Now"
8. Observe Tab 2

**Expected Results:**
- ✅ Tab 2 shows logged-in state automatically
- ✅ When Tab 1 extends session, Tab 2 warning dismisses (if showing)
- ✅ When Tab 1 logs out, Tab 2 also logs out
- ✅ Tab 2 redirects to login page
- ✅ Console in both tabs shows broadcast messages

**Pass Criteria:** Both tabs stay synchronized for all session events.

---

### Test Scenario 9: Responsive Design

**Objective:** Verify warning dialog works on different screen sizes.

**Steps:**
1. Login on desktop browser
2. Wait for warning dialog
3. Open DevTools → Toggle device toolbar (Ctrl+Shift+M)
4. Test different devices:
   - iPhone SE (375x667)
   - iPad (768x1024)
   - Desktop (1920x1080)
5. Verify dialog appearance and functionality

**Expected Results:**
- ✅ Dialog centered on all screen sizes
- ✅ Text readable on mobile
- ✅ Buttons accessible and clickable
- ✅ No horizontal scrolling
- ✅ Countdown timer visible
- ✅ On mobile: buttons stack vertically

**Pass Criteria:** Dialog works well on all tested screen sizes.

---

### Test Scenario 10: Network Throttling

**Objective:** Verify keepalive works under poor network conditions.

**Steps:**
1. Login to application
2. Open DevTools → Network tab
3. Set throttling to "Slow 3G"
4. Perform user activities (move mouse, click)
5. Wait for keepalive request
6. Observe request timing and response

**Expected Results:**
- ✅ Keepalive request still sent
- ✅ Request may take longer but completes
- ✅ Session extended on successful response
- ✅ Error handling if request fails
- ✅ User not logged out due to network delay

**Pass Criteria:** System handles slow network gracefully.

---

## Phase 9: Iframe Session Validation Testing

### Prerequisites
- Phase 9 implementation completed
- Backend and frontend running
- Two HTML files created for testing (see below)

### Setup: Create Test HTML Files

#### File 1: `parent-page.html`
Create this file in your project root or a test folder:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Parent Page - Iframe Test</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            margin-bottom: 20px;
        }
        .controls {
            margin-bottom: 20px;
            padding: 15px;
            background: #e3f2fd;
            border-radius: 4px;
        }
        button {
            padding: 10px 20px;
            margin-right: 10px;
            background: #2196F3;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        }
        button:hover {
            background: #1976D2;
        }
        button.danger {
            background: #f44336;
        }
        button.danger:hover {
            background: #d32f2f;
        }
        #iframe-container {
            border: 2px solid #ddd;
            border-radius: 4px;
            overflow: hidden;
            margin-top: 20px;
        }
        iframe {
            width: 100%;
            height: 600px;
            border: none;
        }
        .log {
            margin-top: 20px;
            padding: 15px;
            background: #f5f5f5;
            border-radius: 4px;
            max-height: 200px;
            overflow-y: auto;
            font-family: 'Courier New', monospace;
            font-size: 12px;
        }
        .log-entry {
            padding: 5px;
            margin-bottom: 5px;
            border-left: 3px solid #2196F3;
            padding-left: 10px;
        }
        .log-entry.received {
            border-left-color: #4CAF50;
        }
        .log-entry.sent {
            border-left-color: #FF9800;
        }
        .log-entry.error {
            border-left-color: #f44336;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🖼️ Parent Page - Iframe Session Test</h1>
        
        <div class="controls">
            <h3>Parent Controls:</h3>
            <button onclick="sendSessionCheck()">Check Session</button>
            <button onclick="sendLogoutCommand()" class="danger">Send Logout Command</button>
            <button onclick="clearLog()">Clear Log</button>
            <button onclick="reloadIframe()">Reload Iframe</button>
        </div>

        <div id="iframe-container">
            <iframe 
                id="app-iframe" 
                src="http://localhost:4200"
                title="Angular App in Iframe">
            </iframe>
        </div>

        <div class="log">
            <h4>Message Log:</h4>
            <div id="log-content"></div>
        </div>
    </div>

    <script>
        const iframe = document.getElementById('app-iframe');
        const logContent = document.getElementById('log-content');

        // Listen for messages from iframe
        window.addEventListener('message', (event) => {
            // Validate origin
            if (event.origin !== 'http://localhost:4200') {
                logMessage('Rejected message from unknown origin: ' + event.origin, 'error');
                return;
            }

            logMessage('Received: ' + JSON.stringify(event.data), 'received');

            // Handle different message types
            if (event.data.type === 'session-valid') {
                logMessage('✅ Session is valid', 'received');
            } else if (event.data.type === 'session-invalid') {
                logMessage('❌ Session is invalid', 'error');
            } else if (event.data.type === 'logout') {
                logMessage('🚪 User logged out from iframe', 'received');
            }
        });

        function sendSessionCheck() {
            const message = {
                type: 'session-check',
                timestamp: Date.now()
            };
            iframe.contentWindow.postMessage(message, 'http://localhost:4200');
            logMessage('Sent: ' + JSON.stringify(message), 'sent');
        }

        function sendLogoutCommand() {
            const message = {
                type: 'logout',
                timestamp: Date.now()
            };
            iframe.contentWindow.postMessage(message, 'http://localhost:4200');
            logMessage('Sent: ' + JSON.stringify(message), 'sent');
        }

        function reloadIframe() {
            iframe.src = iframe.src;
            logMessage('🔄 Iframe reloaded', 'sent');
        }

        function clearLog() {
            logContent.innerHTML = '';
        }

        function logMessage(message, type = 'info') {
            const entry = document.createElement('div');
            entry.className = 'log-entry ' + type;
            entry.textContent = new Date().toLocaleTimeString() + ' - ' + message;
            logContent.appendChild(entry);
            logContent.scrollTop = logContent.scrollHeight;
        }

        // Log when iframe loads
        iframe.addEventListener('load', () => {
            logMessage('📱 Iframe loaded successfully', 'received');
        });

        logMessage('🚀 Parent page initialized', 'info');
    </script>
</body>
</html>
```

#### File 2: `unauthorized-parent.html`
Create this file to test origin validation:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Unauthorized Parent - Should Be Blocked</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 20px;
            background: #ffebee;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
        }
        .warning {
            background: #fff3cd;
            border: 2px solid #ffc107;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
        }
        iframe {
            width: 100%;
            height: 600px;
            border: 2px solid #f44336;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>⚠️ Unauthorized Parent Page</h1>
        <div class="warning">
            <strong>Warning:</strong> This page is NOT in the allowed origins list.
            The iframe should be blocked by X-Frame-Options or CSP headers.
        </div>
        <iframe 
            src="http://localhost:4200"
            title="Should be blocked">
        </iframe>
        <p id="status">Loading iframe...</p>
    </div>

    <script>
        setTimeout(() => {
            const status = document.getElementById('status');
            status.textContent = 'If you see the app above, security headers are NOT working correctly!';
            status.style.color = 'red';
            status.style.fontWeight = 'bold';
        }, 2000);
    </script>
</body>
</html>
```

---

### Iframe Test Scenario 1: Iframe Detection

**Objective:** Verify app detects it's running in an iframe.

**Steps:**
1. Open `parent-page.html` in browser (file:// or local server)
2. Wait for iframe to load
3. Open DevTools on the iframe (right-click iframe → Inspect)
4. Check Console tab

**Expected Results:**
- ✅ Console shows: `[App] Running in iframe, setting up validation`
- ✅ Console shows: `[IframeService] Starting iframe validation`
- ✅ App loads normally inside iframe
- ✅ Login page appears if not authenticated

**Pass Criteria:** App detects iframe context and logs appropriate messages.

---

### Iframe Test Scenario 2: PostMessage Communication

**Objective:** Verify parent-child communication works.

**Steps:**
1. In `parent-page.html`, login to the app in iframe
2. Click "Check Session" button in parent controls
3. Observe parent's message log
4. Check iframe console

**Expected Results:**
- ✅ Parent log shows: "Sent: {type: 'session-check', ...}"
- ✅ Iframe console shows: "Received message from parent"
- ✅ Iframe responds with session status
- ✅ Parent log shows: "Received: {type: 'session-valid', ...}"
- ✅ Parent log shows: "✅ Session is valid"

**Pass Criteria:** Bidirectional communication works correctly.

---

### Iframe Test Scenario 3: Logout Command from Parent

**Objective:** Verify parent can trigger logout in iframe.

**Steps:**
1. Ensure user is logged in within iframe
2. Click "Send Logout Command" button in parent
3. Observe iframe behavior
4. Check both parent and iframe consoles

**Expected Results:**
- ✅ Parent log shows: "Sent: {type: 'logout', ...}"
- ✅ Iframe receives logout command
- ✅ Iframe logs out user
- ✅ Iframe redirects to login page
- ✅ Parent receives logout confirmation

**Pass Criteria:** Parent can successfully trigger logout in iframe.

---

### Iframe Test Scenario 4: Periodic Session Validation

**Objective:** Verify automatic session validation in iframe.

**Steps:**
1. Login to app in iframe
2. Open iframe DevTools → Network tab
3. Filter by "session"
4. Wait 60 seconds (validation interval)
5. Observe network requests

**Expected Results:**
- ✅ GET request to `/auth/session` every 60 seconds
- ✅ Console shows: `[IframeService] Validating session`
- ✅ Response status: 200 OK
- ✅ Session remains valid
- ✅ No logout triggered

**Pass Criteria:** Validation requests sent every 60 seconds.

---

### Iframe Test Scenario 5: Invalid Session Handling

**Objective:** Verify iframe handles invalid session correctly.

**Steps:**
1. Login to app in iframe
2. Manually delete session from Redis (or wait for expiry)
3. Wait for next validation cycle (60 seconds)
4. Observe iframe behavior

**Expected Results:**
- ✅ Validation request returns 401 Unauthorized
- ✅ Console shows: `[IframeService] Session invalid`
- ✅ User logged out automatically
- ✅ Redirected to login page
- ✅ Parent receives 'session-invalid' message

**Pass Criteria:** Invalid session triggers automatic logout.

---

### Iframe Test Scenario 6: Origin Validation

**Objective:** Verify only allowed origins can communicate.

**Steps:**
1. Open `parent-page.html` (allowed origin)
2. Send message to iframe
3. Verify message received
4. Open `unauthorized-parent.html` (unauthorized origin)
5. Try to send message
6. Check iframe console

**Expected Results:**
- ✅ Allowed origin: Messages received and processed
- ✅ Unauthorized origin: Messages rejected
- ✅ Console shows: "Rejected message from unknown origin"
- ✅ No action taken on unauthorized messages

**Pass Criteria:** Only allowed origins can communicate with iframe.

---

### Iframe Test Scenario 7: Security Headers (X-Frame-Options)

**Objective:** Verify X-Frame-Options prevents unauthorized embedding.

**Steps:**
1. Configure backend to set X-Frame-Options: DENY
2. Open `unauthorized-parent.html`
3. Observe iframe loading behavior
4. Check browser console

**Expected Results:**
- ✅ Iframe fails to load
- ✅ Console shows: "Refused to display ... in a frame because it set 'X-Frame-Options' to 'deny'"
- ✅ Blank iframe or error message
- ✅ App not accessible from unauthorized parent

**Pass Criteria:** Unauthorized embedding is blocked.

---

### Iframe Test Scenario 8: CSP frame-ancestors

**Objective:** Verify CSP frame-ancestors restricts embedding.

**Steps:**
1. Configure backend CSP: `frame-ancestors 'self' http://localhost:8080`
2. Open app from `http://localhost:8080` (allowed)
3. Verify app loads
4. Open app from different origin
5. Verify app blocked

**Expected Results:**
- ✅ Allowed origin: App loads successfully
- ✅ Unauthorized origin: App blocked
- ✅ Console shows CSP violation
- ✅ Security policy enforced

**Pass Criteria:** CSP correctly restricts embedding origins.

---

### Iframe Test Scenario 9: Session Warning in Iframe

**Objective:** Verify session warning works inside iframe.

**Steps:**
1. Login to app in iframe
2. Wait for session warning (30 seconds with test config)
3. Observe warning dialog
4. Test "Stay Logged In" button
5. Verify session extended

**Expected Results:**
- ✅ Warning dialog appears in iframe
- ✅ Countdown timer works
- ✅ "Stay Logged In" extends session
- ✅ Parent receives session extension notification
- ✅ All functionality works same as standalone

**Pass Criteria:** Session warning works correctly in iframe context.

---

### Iframe Test Scenario 10: Iframe Reload Handling

**Objective:** Verify session persists across iframe reloads.

**Steps:**
1. Login to app in iframe
2. Click "Reload Iframe" button in parent
3. Wait for iframe to reload
4. Observe authentication state

**Expected Results:**
- ✅ Iframe reloads successfully
- ✅ Session cookie persists
- ✅ User remains logged in
- ✅ Dashboard loads automatically
- ✅ No re-login required

**Pass Criteria:** Session persists across iframe reloads.

---

## Testing Tools & Setup

### Required Tools
1. **Browser DevTools** (F12)
   - Console tab for logs
   - Network tab for requests
   - Application tab for cookies/storage

2. **Multiple Browser Tabs**
   - Test cross-tab synchronization
   - Test concurrent sessions

3. **Device Emulation**
   - Test responsive design
   - Test mobile interactions

4. **Network Throttling**
   - Test slow connections
   - Test timeout handling

### Setup Checklist
- [ ] Backend running on port 3000
- [ ] Frontend running on port 4200
- [ ] Redis running and accessible
- [ ] Test HTML files created
- [ ] Browser DevTools open
- [ ] Console logs visible

---

## Common Issues & Solutions

### Issue: Warning Dialog Not Appearing

**Symptoms:**
- Console shows warning log but no dialog visible
- Timer expires too quickly

**Solutions:**
1. Check if `showSessionWarning$` is subscribed in template
2. Verify SharedModule is imported in AppModule
3. Increase WARNING_THRESHOLD for easier testing
4. Keep browser tab in foreground (background tabs throttle timers)

### Issue: Keepalive Requests Not Sent

**Symptoms:**
- No network requests to `/auth/keepalive`
- Activity not detected

**Solutions:**
1. Verify KeepaliveService is started in AppComponent
2. Check if user is authenticated
3. Perform more obvious activities (click, type)
4. Wait for debounce period (2 seconds)

### Issue: Iframe Not Loading

**Symptoms:**
- Blank iframe
- Console shows frame errors

**Solutions:**
1. Check X-Frame-Options configuration
2. Verify CSP frame-ancestors settings
3. Ensure origin is in allowed list
4. Check CORS configuration

### Issue: PostMessage Not Working

**Symptoms:**
- Messages not received
- No console logs

**Solutions:**
1. Verify origin validation logic
2. Check if message listener is set up
3. Ensure correct targetOrigin in postMessage
4. Verify message format matches expected structure

---

## Test Results Template

Use this template to document your test results:

```
Test Date: _______________
Tester: _______________
Environment: Development / Staging / Production

Phase 8 Tests:
[ ] Scenario 1: Warning Dialog - PASS / FAIL
[ ] Scenario 2: Countdown Timer - PASS / FAIL
[ ] Scenario 3: Stay Logged In - PASS / FAIL
[ ] Scenario 4: Logout Now - PASS / FAIL
[ ] Scenario 5: Auto-Logout - PASS / FAIL
[ ] Scenario 6: Keyboard Shortcuts - PASS / FAIL
[ ] Scenario 7: Activity Detection - PASS / FAIL
[ ] Scenario 8: Cross-Tab Sync - PASS / FAIL
[ ] Scenario 9: Responsive Design - PASS / FAIL
[ ] Scenario 10: Network Throttling - PASS / FAIL

Phase 9 Tests (when implemented):
[ ] Scenario 1: Iframe Detection - PASS / FAIL
[ ] Scenario 2: PostMessage - PASS / FAIL
[ ] Scenario 3: Logout Command - PASS / FAIL
[ ] Scenario 4: Periodic Validation - PASS / FAIL
[ ] Scenario 5: Invalid Session - PASS / FAIL
[ ] Scenario 6: Origin Validation - PASS / FAIL
[ ] Scenario 7: X-Frame-Options - PASS / FAIL
[ ] Scenario 8: CSP Headers - PASS / FAIL
[ ] Scenario 9: Warning in Iframe - PASS / FAIL
[ ] Scenario 10: Iframe Reload - PASS / FAIL

Notes:
_________________________________
_________________________________
_________________________________
```

---

**Made with Bob** 🚀