# Phase 8: Session Keepalive & Warning Implementation

## Overview
This phase implements automatic session keepalive functionality with user activity detection and a session expiration warning dialog. The system keeps users logged in while they're actively using the application and provides a clear warning before session expiration.

## Problem Statement
Without keepalive functionality:
- Users get logged out after 30 minutes even if actively using the app
- No warning before session expiration
- Poor user experience with unexpected logouts
- Lost work when session expires during active use

## Solution
Implemented a comprehensive session keepalive system with:
1. **Automatic Activity Detection** - Monitors user interactions
2. **Debounced Keepalive Requests** - Extends session on activity
3. **Session Warning Dialog** - Alerts users before expiration
4. **Countdown Timer** - Shows remaining time
5. **Manual Extension** - Users can extend session explicitly

## Implementation Details

### 1. Frontend Components

#### A. Session Warning Dialog Component

**Location:** `frontend/src/app/shared/components/session-warning-dialog/`

**Files Created:**
- `session-warning-dialog.component.ts` - Component logic
- `session-warning-dialog.component.html` - Dialog template
- `session-warning-dialog.component.scss` - Styling

**Features:**
- **Countdown Timer:** Real-time display of remaining session time (MM:SS format)
- **Auto-Update:** Updates every second using RxJS interval
- **Action Buttons:**
  - "Stay Logged In" - Extends session
  - "Logout Now" - Immediate logout
- **Keyboard Shortcuts:**
  - `Enter` - Extend session
  - `Escape` - Logout
- **Auto-Logout:** Automatically logs out when timer reaches zero
- **Responsive Design:** Works on mobile and desktop

**Key Methods:**
```typescript
startCountdown()      // Starts the 1-second interval timer
updateRemainingTime() // Fetches remaining time from SessionService
onExtendSession()     // Calls SessionService.extendSession()
onLogout()            // Dismisses dialog and triggers logout
onKeydown()           // Handles keyboard shortcuts
```

#### B. Keepalive Service

**Location:** `frontend/src/app/core/services/keepalive.service.ts`

**Purpose:** Detects user activity and automatically extends the session.

**Activity Detection:**
Monitors the following events:
- `mousemove` - Mouse movement
- `click` - Mouse clicks
- `keypress` - Keyboard input
- `touchstart` - Touch events (mobile)
- `scroll` - Page scrolling
- `focus` - Window/tab focus

**Debouncing Strategy:**
- **Debounce Time:** 2 seconds - Waits for activity to stop
- **Throttle Time:** 60 seconds - Minimum time between keepalive requests
- **Why?** Prevents excessive API calls while ensuring timely session extension

**Configuration:**
```typescript
DEBOUNCE_TIME = 2000   // 2 seconds
THROTTLE_TIME = 60000  // 1 minute
```

**Key Methods:**
```typescript
start()                    // Start monitoring activity
stop()                     // Stop monitoring activity
setupActivityListeners()   // Configure event listeners
handleActivity()           // Process detected activity
sendKeepalive()           // Send keepalive request to backend
```

**Flow:**
1. User performs action (mouse move, click, etc.)
2. Event is captured and merged with other activity events
3. Debounced for 2 seconds (waits for activity to stop)
4. Throttled to 1 minute minimum between requests
5. Keepalive request sent to backend
6. Session extended, local state updated

#### C. Session Service Enhancement

**Location:** `frontend/src/app/core/services/session.service.ts`

**New Method Added:**
```typescript
extendSession(): void {
  // Extends session by updating activity
  this.updateActivity();
}
```

**Existing Features Used:**
- `sessionWarning$` - Observable for warning state
- `getRemainingTime()` - Gets remaining session time in ms
- `dismissWarning()` - Hides warning dialog
- `updateActivity()` - Updates session activity timestamp

### 2. Backend Implementation

#### Keepalive Endpoint

**Location:** `backend/src/auth/auth.controller.ts`

**Endpoint:** `POST /auth/keepalive`

**Authentication:** Required (uses `AuthenticatedGuard`)

**Implementation:**
```typescript
@UseGuards(AuthenticatedGuard)
@Post('keepalive')
@HttpCode(HttpStatus.OK)
async keepalive(@Req() req: Request) {
  // Update last activity timestamp
  if (req.session) {
    req.session.lastActivity = Date.now();
  }

  // Calculate new expiry time (30 minutes from now)
  const expiresAt = Date.now() + (30 * 60 * 1000);

  return {
    message: 'Session extended',
    expiresAt,
  };
}
```

**How It Works:**
1. Validates user is authenticated
2. Updates `lastActivity` timestamp in session
3. Session TTL is automatically extended by `rolling: true` configuration
4. Returns new expiry time to frontend
5. Frontend updates local session state

**Session Configuration:**
The backend uses `rolling: true` in session configuration, which means:
- Session TTL is reset on every request
- Keepalive requests automatically extend the session
- No manual TTL management needed

### 3. Integration

#### App Component Updates

**Location:** `frontend/src/app/app.component.ts`

**Changes:**
1. **Imported Services:**
   - `SessionService` - For session warning state
   - `KeepaliveService` - For activity monitoring

2. **Added Observable:**
   ```typescript
   showSessionWarning$: Observable<boolean>;
   ```

3. **Lifecycle Management:**
   ```typescript
   ngOnInit() {
     // Start keepalive when authenticated
     this.authService.isAuthenticated$.subscribe((isAuthenticated) => {
       if (isAuthenticated) {
         this.keepaliveService.start();
       } else {
         this.keepaliveService.stop();
       }
     });
   }

   ngOnDestroy() {
     this.keepaliveService.stop();
   }
   ```

**Template Update:**
```html
<router-outlet></router-outlet>
<app-session-warning-dialog *ngIf="showSessionWarning$ | async">
</app-session-warning-dialog>
```

#### Shared Module Update

**Location:** `frontend/src/app/shared/shared.module.ts`

**Changes:**
- Declared `SessionWarningDialogComponent`
- Exported `SessionWarningDialogComponent`

#### App Module Update

**Location:** `frontend/src/app/app.module.ts`

**Changes:**
- Imported `SharedModule`

## User Experience Flow

### Normal Session Flow

1. **User Logs In:**
   - Session created with 30-minute expiry
   - Keepalive service starts monitoring activity
   - Session service starts expiry timer

2. **User is Active:**
   - User moves mouse, types, clicks, etc.
   - Activity detected and debounced (2 seconds)
   - Keepalive request sent (max once per minute)
   - Session extended to 30 minutes from now
   - Expiry timer reset

3. **User Becomes Idle:**
   - No activity detected
   - No keepalive requests sent
   - Session continues to count down

4. **5 Minutes Before Expiry:**
   - Session warning dialog appears
   - Countdown timer shows remaining time
   - User can:
     - Click "Stay Logged In" → Session extended
     - Click "Logout Now" → Immediate logout
     - Do nothing → Auto-logout at 0:00

5. **Session Expires:**
   - User automatically logged out
   - Redirected to login page
   - All tabs synchronized via BroadcastService

### Cross-Tab Synchronization

**Scenario:** User has multiple tabs open

1. **Tab A:** User is active
   - Keepalive request sent
   - Session extended

2. **Tab B:** Receives 'extend' broadcast
   - Local session state updated
   - Warning timer reset
   - Warning dialog dismissed if showing

3. **Tab A:** User logs out
   - Logout broadcast sent

4. **Tab B:** Receives 'logout' broadcast
   - Session cleared
   - Redirected to login page

## Configuration

### Session Timing

**Current Settings:**
```typescript
SESSION_DURATION = 30 * 60 * 1000;  // 30 minutes
WARNING_THRESHOLD = 5 * 60 * 1000;  // 5 minutes before expiry
```

**To Modify:**
1. Update `SESSION_DURATION` in `session.service.ts`
2. Update `WARNING_THRESHOLD` in `session.service.ts`
3. Update backend session `maxAge` in `configuration.ts`
4. Ensure all three values are synchronized

### Activity Detection

**Current Settings:**
```typescript
DEBOUNCE_TIME = 2000;   // 2 seconds
THROTTLE_TIME = 60000;  // 1 minute
```

**To Modify:**
- Increase `DEBOUNCE_TIME` for less sensitive detection
- Decrease `THROTTLE_TIME` for more frequent keepalive requests
- Add/remove event types in `setupActivityListeners()`

## Testing

### Manual Testing Steps

#### Test 1: Session Warning Display
1. Login to the application
2. Wait 25 minutes (or reduce `SESSION_DURATION` for testing)
3. **Expected:** Warning dialog appears at 5 minutes remaining
4. **Expected:** Countdown timer shows MM:SS format
5. **Expected:** Timer updates every second

#### Test 2: Extend Session
1. Wait for warning dialog to appear
2. Click "Stay Logged In" button
3. **Expected:** Dialog closes
4. **Expected:** Session extended to 30 minutes
5. **Expected:** Can continue using the app

#### Test 3: Auto-Logout
1. Wait for warning dialog to appear
2. Do not click any buttons
3. Wait for countdown to reach 0:00
4. **Expected:** Automatically logged out
5. **Expected:** Redirected to login page

#### Test 4: Activity Detection
1. Login to the application
2. Perform various activities (move mouse, type, click)
3. Check network tab for keepalive requests
4. **Expected:** Keepalive requests sent (max once per minute)
5. **Expected:** Session stays active

#### Test 5: Keyboard Shortcuts
1. Wait for warning dialog to appear
2. Press `Enter` key
3. **Expected:** Session extended, dialog closes
4. Wait for warning again
5. Press `Escape` key
6. **Expected:** Logged out, redirected to login

#### Test 6: Cross-Tab Synchronization
1. Open application in two tabs
2. In Tab 1: Wait for warning dialog
3. In Tab 1: Click "Stay Logged In"
4. **Expected:** Tab 2 warning also dismisses
5. In Tab 1: Logout
6. **Expected:** Tab 2 also logs out and redirects

### Automated Testing

**Unit Tests Needed:**
- `KeepaliveService.start()` - Starts monitoring
- `KeepaliveService.stop()` - Stops monitoring
- `KeepaliveService.handleActivity()` - Processes activity
- `SessionWarningDialogComponent.onExtendSession()` - Extends session
- `SessionWarningDialogComponent.onLogout()` - Logs out
- `SessionWarningDialogComponent.formattedTime` - Formats time correctly

**Integration Tests Needed:**
- Keepalive request extends session
- Warning dialog appears at correct time
- Auto-logout works when timer expires
- Cross-tab synchronization works

## Security Considerations

### 1. Authentication Required
- Keepalive endpoint requires authentication
- Unauthenticated requests are rejected
- Session validation on every request

### 2. Rate Limiting
- Throttled to max 1 request per minute
- Prevents abuse/DoS attacks
- Backend can add additional rate limiting

### 3. Session Validation
- Backend validates session on every keepalive
- Invalid sessions are rejected
- Expired sessions cannot be extended

### 4. CSRF Protection
- Keepalive requests include CSRF token
- Protected by CSRF interceptor
- Prevents cross-site request forgery

## Performance Considerations

### 1. Debouncing
- Waits 2 seconds after activity stops
- Prevents excessive event processing
- Reduces CPU usage

### 2. Throttling
- Max 1 keepalive request per minute
- Reduces network traffic
- Reduces backend load

### 3. Event Listener Optimization
- Uses passive event listeners where possible
- Properly cleaned up on component destroy
- No memory leaks

### 4. Timer Management
- Single interval timer for countdown
- Cleared on component destroy
- Efficient time calculations

## Browser Compatibility

### Supported Browsers
- Chrome 54+ (BroadcastChannel API)
- Firefox 38+ (BroadcastChannel API)
- Edge 79+ (BroadcastChannel API)
- Safari 15.4+ (BroadcastChannel API)

### Fallback
- localStorage events for older browsers
- Implemented in BroadcastService
- Automatic fallback, no configuration needed

## Future Enhancements

### 1. Configurable Warning Time
- Allow users to set warning threshold
- Store preference in user settings
- Default to 5 minutes

### 2. Multiple Warning Levels
- First warning at 10 minutes
- Second warning at 5 minutes
- Final warning at 1 minute

### 3. Activity Heatmap
- Track which activities are most common
- Optimize detection based on usage patterns
- Analytics for session management

### 4. Smart Keepalive
- Detect if user is actively working vs. idle
- Adjust keepalive frequency based on activity level
- Machine learning for activity prediction

### 5. Session History
- Track session extensions
- Show user their session history
- Analytics for session duration

## Troubleshooting

### Issue: Warning Dialog Not Appearing

**Possible Causes:**
1. Session service not initialized
2. Session warning timer not started
3. Component not imported in SharedModule
4. Browser timer throttling delays the warning callback until very close to expiry
5. Testing values are too short to make the popup visibly noticeable
6. Session state is cleared so quickly after warning that the dialog is removed before the user sees it

**Solution:**
- Check browser console for errors
- Verify SessionService is injected
- Verify SharedModule is imported in AppModule
- Look for the console message: `[SessionService] ⚠️ SHOWING WARNING DIALOG`
- Keep the tab in the foreground during testing
- Increase the warning visibility window for testing:
  - `SESSION_DURATION = 2 * 60 * 1000`
  - `WARNING_THRESHOLD = 90 * 1000`
- In DevTools Elements, verify `<app-session-warning-dialog>` appears under `<app-root>`

### Issue: Warning Logged in Console but Not Visible in Browser

**Observed Behavior:**
- Console shows:
  - `[SessionService] ⚠️ SHOWING WARNING DIALOG`
  - `[SessionService] 🚪 SESSION EXPIRED - Auto logout`
- User does not notice the popup in the browser

**Root Cause:**
- The warning state is emitted correctly, but the visible warning period may be too short during testing
- Inactive/background browser tabs can delay `setTimeout` execution
- When the delayed warning fires too close to expiry, the logout can happen almost immediately after the warning is shown

**Implemented Fix / Modification:**
- Increased testing warning threshold in `frontend/src/app/core/services/session.service.ts`
  - from `30 seconds` to `90 seconds before expiry`
- Added warning broadcast in the immediate-warning branch so cross-tab UI state stays aligned
- Updated `frontend/src/app/shared/components/session-warning-dialog/session-warning-dialog.component.ts`
  - `onLogout()` now calls `AuthService.logout()` in addition to ending the local session
  - this makes manual logout from the popup consistent with the expiry-driven logout flow

**Future Reference Note:**
- For short-duration testing, prefer a large warning window so the UI can be visually confirmed
- Recommended test-only values:
  ```typescript
  SESSION_DURATION = 2 * 60 * 1000;
  WARNING_THRESHOLD = 90 * 1000;
  ```
- After verification, revert to production-aligned values and retest the full flow

### Issue: Keepalive Not Working

**Possible Causes:**
1. KeepaliveService not started
2. Backend endpoint not responding
3. Authentication token missing

**Solution:**
- Check network tab for keepalive requests
- Verify backend endpoint is accessible
- Check authentication state

### Issue: Session Expires Despite Activity

**Possible Causes:**
1. Throttle time too long
2. Backend session TTL too short
3. Activity not being detected

**Solution:**
- Reduce THROTTLE_TIME
- Increase backend session maxAge
- Add console.log to verify activity detection

### Issue: Too Many Keepalive Requests

**Possible Causes:**
1. Debounce time too short
2. Throttle time too short
3. Multiple event listeners

**Solution:**
- Increase DEBOUNCE_TIME
- Increase THROTTLE_TIME
- Verify service is singleton

## Files Modified/Created

### Frontend Files Created
- `frontend/src/app/shared/components/session-warning-dialog/session-warning-dialog.component.ts`
- `frontend/src/app/shared/components/session-warning-dialog/session-warning-dialog.component.html`
- `frontend/src/app/shared/components/session-warning-dialog/session-warning-dialog.component.scss`
- `frontend/src/app/core/services/keepalive.service.ts`

### Frontend Files Modified
- `frontend/src/app/core/services/session.service.ts` - Added extendSession(), warning timer handling, and testing-time warning visibility adjustment
- `frontend/src/app/shared/shared.module.ts` - Added SessionWarningDialogComponent
- `frontend/src/app/app.module.ts` - Imported SharedModule
- `frontend/src/app/app.component.ts` - Integrated keepalive and warning
- `frontend/src/app/app.component.html` - Added warning dialog
- `frontend/src/app/shared/components/session-warning-dialog/session-warning-dialog.component.ts` - Updated logout flow to call AuthService logout consistently

### Backend Files Modified
- `backend/src/auth/auth.controller.ts` - Added keepalive endpoint

## Conclusion

Phase 8 successfully implements a comprehensive session keepalive and warning system that:
- ✅ Automatically extends sessions based on user activity
- ✅ Provides clear warnings before session expiration
- ✅ Offers manual session extension
- ✅ Synchronizes across multiple tabs
- ✅ Maintains security with authentication and CSRF protection
- ✅ Optimizes performance with debouncing and throttling
- ✅ Provides excellent user experience

The implementation follows best practices for session management and provides a solid foundation for future enhancements.

---

**Made with Bob** 🚀