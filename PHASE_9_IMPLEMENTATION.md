# Phase 9: Iframe Session Validation Implementation

## Overview
This phase implements iframe detection and session validation for applications embedded in iframes. The system detects when the Angular application is running inside an iframe, establishes secure PostMessage communication with the parent window, and performs periodic session validation to ensure the user remains authenticated.

## Problem Statement
When applications are embedded in iframes:
- Session validation becomes critical for security
- Parent-child communication needs to be secure
- Session state must be synchronized between iframe and parent
- Security headers must prevent unauthorized embedding
- Invalid sessions need graceful handling

## Solution
Implement a comprehensive iframe session validation system with:
1. **Iframe Detection** - Detect if app is running in iframe context
2. **PostMessage Communication** - Secure parent-child messaging
3. **Periodic Session Validation** - Regular session checks
4. **Security Headers** - X-Frame-Options and CSP configuration
5. **Graceful Logout** - Handle invalid sessions appropriately

## Implementation Details

### 1. Frontend Components

#### A. Iframe Service

**Location:** `frontend/src/app/core/services/iframe.service.ts`

**Purpose:** Detect iframe context and manage PostMessage communication.

**Features:**
- **Iframe Detection:** Checks if `window.self !== window.top`
- **PostMessage API:** Secure communication with parent window
- **Message Validation:** Validates origin and message structure
- **Event Listeners:** Handles incoming messages from parent
- **Session Sync:** Synchronizes session state with parent

**Key Methods:**
```typescript
isInIframe(): boolean              // Check if running in iframe
sendMessageToParent(message: any)  // Send message to parent window
setupMessageListener()             // Listen for parent messages
validateOrigin(origin: string)     // Validate message origin
handleSessionInvalid()             // Handle invalid session
```

**Configuration:**
```typescript
ALLOWED_ORIGINS = [
  'https://parent-domain.com',
  'https://trusted-domain.com'
];
VALIDATION_INTERVAL = 60000; // 1 minute
```

**Message Types:**
```typescript
interface IframeMessage {
  type: 'session-check' | 'session-valid' | 'session-invalid' | 'logout';
  payload?: any;
  timestamp: number;
}
```

#### B. Session Validation Integration

**Location:** `frontend/src/app/core/services/session.service.ts`

**New Methods:**
```typescript
validateSession(): Observable<boolean> {
  // Call backend to validate current session
  // Return true if valid, false if invalid
}

setupIframeValidation(): void {
  // Set up periodic validation when in iframe
  // Call validateSession() every VALIDATION_INTERVAL
}
```

**Validation Flow:**
1. Check if running in iframe
2. If yes, start periodic validation timer
3. Call backend `/auth/session` endpoint
4. If valid, continue normally
5. If invalid, trigger logout and notify parent

### 2. Backend Implementation

#### Session Validation Endpoint Enhancement

**Location:** `backend/src/auth/auth.controller.ts`

**Existing Endpoint:** `GET /auth/session`

**Enhancement:**
```typescript
@UseGuards(AuthenticatedGuard)
@Get('session')
async getSession(@Req() req: Request) {
  // Check if session is valid
  if (!req.session || !req.user) {
    throw new UnauthorizedException('Session invalid');
  }

  // Check if session is expired
  const now = Date.now();
  const lastActivity = req.session.lastActivity || 0;
  const maxAge = 30 * 60 * 1000; // 30 minutes

  if (now - lastActivity > maxAge) {
    throw new UnauthorizedException('Session expired');
  }

  return {
    user: req.user as User,
    authenticated: true,
    expiresAt: lastActivity + maxAge,
  };
}
```

#### Security Headers Configuration

**Location:** `backend/src/main.ts`

**X-Frame-Options Header:**
```typescript
app.use((req, res, next) => {
  // Allow specific domains to embed in iframe
  const allowedOrigins = [
    'https://parent-domain.com',
    'https://trusted-domain.com'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('X-Frame-Options', `ALLOW-FROM ${origin}`);
  } else {
    res.setHeader('X-Frame-Options', 'DENY');
  }
  
  next();
});
```

**Content Security Policy (CSP):**
```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      frameAncestors: [
        "'self'",
        'https://parent-domain.com',
        'https://trusted-domain.com'
      ],
      // ... other CSP directives
    },
  },
}));
```

### 3. Integration

#### App Component Updates

**Location:** `frontend/src/app/app.component.ts`

**Changes:**
```typescript
import { IframeService } from './core/services/iframe.service';

constructor(
  // ... existing services
  private iframeService: IframeService
) {}

ngOnInit(): void {
  // ... existing initialization

  // Set up iframe validation if in iframe context
  if (this.iframeService.isInIframe()) {
    console.log('[App] Running in iframe, setting up validation');
    this.sessionService.setupIframeValidation();
    this.iframeService.setupMessageListener();
  }
}
```

#### Core Module Update

**Location:** `frontend/src/app/core/core.module.ts`

**Changes:**
- Add `IframeService` to providers (already singleton via `providedIn: 'root'`)

## User Experience Flow

### Normal Iframe Flow

1. **App Loads in Iframe:**
   - IframeService detects iframe context
   - Sets up PostMessage listener
   - Starts periodic session validation

2. **Periodic Validation:**
   - Every 60 seconds, validate session with backend
   - If valid, continue normally
   - If invalid, trigger logout

3. **Parent Communication:**
   - Send session status to parent window
   - Receive commands from parent (logout, refresh, etc.)
   - Validate all messages by origin

4. **Session Invalid:**
   - Logout user locally
   - Send 'session-invalid' message to parent
   - Parent can redirect or show message

### Security Flow

1. **Origin Validation:**
   - All PostMessage communications validate origin
   - Only allowed origins can communicate
   - Reject messages from unknown origins

2. **Header Protection:**
   - X-Frame-Options prevents unauthorized embedding
   - CSP frame-ancestors restricts parent domains
   - Only trusted domains can embed the app

3. **Session Validation:**
   - Backend validates session on every check
   - Expired sessions are rejected
   - Invalid sessions trigger logout

## Configuration

### Iframe Service Configuration

**Location:** `frontend/src/app/core/services/iframe.service.ts`

```typescript
// Allowed parent origins
ALLOWED_ORIGINS = [
  'https://parent-domain.com',
  'https://trusted-domain.com',
  'http://localhost:4200', // Development only
];

// Validation interval (milliseconds)
VALIDATION_INTERVAL = 60000; // 1 minute

// Message timeout (milliseconds)
MESSAGE_TIMEOUT = 5000; // 5 seconds
```

### Backend Security Headers

**Location:** `backend/src/main.ts`

```typescript
// Allowed iframe parents
const ALLOWED_FRAME_ORIGINS = [
  'https://parent-domain.com',
  'https://trusted-domain.com',
];

// CSP frame-ancestors
const FRAME_ANCESTORS = [
  "'self'",
  'https://parent-domain.com',
  'https://trusted-domain.com',
];
```

## Testing

### Manual Testing Steps

#### Test 1: Iframe Detection
1. Open app in normal browser window
2. **Expected:** `isInIframe()` returns false
3. Embed app in iframe
4. **Expected:** `isInIframe()` returns true
5. **Expected:** Console shows "Running in iframe"

#### Test 2: Session Validation
1. Login to app in iframe
2. Wait for validation interval (60 seconds)
3. **Expected:** Backend receives validation request
4. **Expected:** Session remains valid
5. Manually expire session in backend
6. **Expected:** Next validation triggers logout

#### Test 3: PostMessage Communication
1. Embed app in iframe with parent page
2. Parent sends 'session-check' message
3. **Expected:** App responds with session status
4. Parent sends 'logout' message
5. **Expected:** App logs out user

#### Test 4: Origin Validation
1. Embed app in iframe from allowed origin
2. **Expected:** PostMessage works normally
3. Embed app from unauthorized origin
4. **Expected:** PostMessage rejected
5. **Expected:** Console shows origin validation error

#### Test 5: Security Headers
1. Try to embed app from unauthorized domain
2. **Expected:** X-Frame-Options blocks embedding
3. Check CSP headers in browser DevTools
4. **Expected:** frame-ancestors includes only allowed domains

#### Test 6: Invalid Session Handling
1. Login to app in iframe
2. Manually invalidate session (delete from Redis)
3. Wait for next validation
4. **Expected:** User logged out
5. **Expected:** Parent receives 'session-invalid' message

### Automated Testing

**Unit Tests Needed:**
- `IframeService.isInIframe()` - Detects iframe correctly
- `IframeService.validateOrigin()` - Validates allowed origins
- `IframeService.sendMessageToParent()` - Sends messages correctly
- `SessionService.validateSession()` - Validates session with backend
- `SessionService.setupIframeValidation()` - Sets up periodic validation

**Integration Tests Needed:**
- Iframe detection and initialization
- PostMessage communication flow
- Session validation with backend
- Invalid session handling
- Security header enforcement

**E2E Tests Needed:**
- Full iframe embedding scenario
- Parent-child communication
- Session validation and logout
- Cross-origin security

## Security Considerations

### 1. Origin Validation
- **Always validate message origin** before processing
- Maintain whitelist of allowed origins
- Reject messages from unknown origins
- Log suspicious origin attempts

### 2. Message Validation
- Validate message structure and type
- Sanitize message payload
- Implement message timeout
- Prevent message replay attacks

### 3. Session Security
- Validate session on every check
- Enforce session expiration
- Prevent session fixation
- Use secure session cookies

### 4. Header Security
- Configure X-Frame-Options correctly
- Set strict CSP frame-ancestors
- Use HTTPS for all iframe communication
- Implement HSTS headers

### 5. Error Handling
- Don't expose sensitive error details
- Log security events
- Graceful degradation on errors
- User-friendly error messages

## Performance Considerations

### 1. Validation Frequency
- Balance security vs. performance
- Default: 60 seconds (1 minute)
- Adjust based on security requirements
- Consider network latency

### 2. PostMessage Overhead
- Minimize message size
- Batch messages when possible
- Use efficient serialization
- Implement message queuing

### 3. Memory Management
- Clean up event listeners
- Clear validation timers
- Prevent memory leaks
- Proper component cleanup

## Browser Compatibility

### PostMessage API
- Chrome 1+
- Firefox 3+
- Safari 4+
- Edge (all versions)
- IE 8+ (with limitations)

### Security Headers
- X-Frame-Options: All modern browsers
- CSP frame-ancestors: Chrome 40+, Firefox 58+, Safari 10+

### Fallback Strategy
- Detect PostMessage support
- Fallback to polling for older browsers
- Graceful degradation
- User notification if unsupported

## Future Enhancements

### 1. Advanced Communication
- Bidirectional data sync
- Real-time notifications
- Shared state management
- Event broadcasting

### 2. Enhanced Security
- Message encryption
- Digital signatures
- Token-based authentication
- Mutual authentication

### 3. Monitoring
- Session validation metrics
- PostMessage analytics
- Security event tracking
- Performance monitoring

### 4. Configuration UI
- Admin panel for allowed origins
- Dynamic origin management
- Validation interval configuration
- Security policy editor

## Troubleshooting

### Issue: Iframe Not Detected

**Possible Causes:**
1. Browser security restrictions
2. Same-origin policy
3. Incorrect detection logic

**Solution:**
- Check `window.self !== window.top`
- Verify browser console for errors
- Test in different browsers

### Issue: PostMessage Not Working

**Possible Causes:**
1. Origin not in whitelist
2. Message format incorrect
3. Event listener not set up

**Solution:**
- Verify origin in ALLOWED_ORIGINS
- Check message structure
- Ensure setupMessageListener() called

### Issue: Session Validation Failing

**Possible Causes:**
1. Backend session expired
2. Network connectivity issues
3. CORS configuration

**Solution:**
- Check backend session store
- Verify network requests
- Review CORS settings

### Issue: Security Headers Blocking

**Possible Causes:**
1. X-Frame-Options too restrictive
2. CSP frame-ancestors misconfigured
3. Origin not allowed

**Solution:**
- Review X-Frame-Options configuration
- Check CSP frame-ancestors directive
- Add origin to allowed list

## Files to Create/Modify

### Frontend Files to Create
- `frontend/src/app/core/services/iframe.service.ts`

### Frontend Files to Modify
- `frontend/src/app/core/services/session.service.ts` - Add iframe validation
- `frontend/src/app/app.component.ts` - Initialize iframe service

### Backend Files to Modify
- `backend/src/auth/auth.controller.ts` - Enhance session validation
- `backend/src/main.ts` - Add security headers

### Configuration Files
- `frontend/src/environments/environment.ts` - Add allowed origins
- `frontend/src/environments/environment.prod.ts` - Production origins

## Conclusion

Phase 9 implements comprehensive iframe session validation with:
- ✅ Iframe context detection
- ✅ Secure PostMessage communication
- ✅ Periodic session validation
- ✅ Security header configuration
- ✅ Origin validation
- ✅ Graceful error handling
- ✅ Cross-browser compatibility

The implementation provides a secure foundation for embedding the Angular application in iframes while maintaining session security and proper communication with parent windows.

---

**Made with Bob** 🚀