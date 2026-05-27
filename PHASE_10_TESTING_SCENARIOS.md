# Phase 10: Security Hardening - Testing Scenarios

This document provides practical testing scenarios to demonstrate the security benefits of Phase 10 implementation.

---

## 🎯 Testing Scenarios Overview

Each scenario shows:
- **Before Phase 10**: What would happen without security hardening
- **After Phase 10**: How the security measures protect the application
- **How to Test**: Step-by-step instructions

---

## Scenario 1: Brute Force Attack Prevention

### 🔴 Before Phase 10
An attacker could make unlimited login attempts, trying thousands of password combinations per minute.

```bash
# Attacker could run this script indefinitely
for i in {1..10000}; do
  curl -X POST http://localhost:3000/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@example.com","password":"attempt'$i'"}'
done
```

**Result**: Server overwhelmed, potential password breach

### ✅ After Phase 10
Rate limiting blocks excessive attempts after 3 tries per minute.

### 📝 How to Test

1. **Start the application**:
   ```bash
   cd backend
   npm run start:dev
   ```

2. **Make 4 rapid login attempts**:
   ```bash
   # Attempt 1
   curl -X POST http://localhost:3000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"wrong1"}'

   # Attempt 2
   curl -X POST http://localhost:3000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"wrong2"}'

   # Attempt 3
   curl -X POST http://localhost:3000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"wrong3"}'

   # Attempt 4 - BLOCKED!
   curl -X POST http://localhost:3000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"wrong4"}'
   ```

3. **Expected Result**:
   - First 3 attempts: `401 Unauthorized` (wrong password)
   - 4th attempt: `429 Too Many Requests` (rate limited)

**Benefit**: Prevents brute force attacks, protects user accounts

---

## Scenario 2: XSS (Cross-Site Scripting) Attack

### 🔴 Before Phase 10
Malicious scripts could be injected through input fields.

```javascript
// Attacker tries to inject script
POST /auth/login
{
  "email": "<script>alert('XSS')</script>@test.com",
  "password": "password123"
}
```

**Result**: Script could execute in browser, steal cookies/tokens

### ✅ After Phase 10
Input sanitization removes HTML/scripts, validation rejects invalid format.

### 📝 How to Test

1. **Test XSS in email field**:
   ```bash
   curl -X POST http://localhost:3000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"<script>alert(\"XSS\")</script>@test.com","password":"password123"}'
   ```

2. **Expected Result**:
   ```json
   {
     "statusCode": 400,
     "message": ["Invalid email format"],
     "error": "Bad Request"
   }
   ```

3. **Test XSS in user creation**:
   ```bash
   curl -X POST http://localhost:3000/users \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "SecurePass123!",
       "firstName": "<img src=x onerror=alert(1)>",
       "lastName": "User"
     }'
   ```

4. **Expected Result**:
   - HTML tags stripped by sanitization pipe
   - Invalid characters rejected by validation

**Benefit**: Prevents XSS attacks, protects user data and sessions

---

## Scenario 3: SQL Injection Attack

### 🔴 Before Phase 10
Attackers could manipulate database queries.

```sql
-- Attacker tries SQL injection
email: admin'--
password: anything

-- Could result in: SELECT * FROM users WHERE email='admin'--' AND password='...'
-- The -- comments out password check!
```

**Result**: Unauthorized access to admin account

### ✅ After Phase 10
Input validation rejects malformed emails, TypeORM uses parameterized queries.

### 📝 How to Test

1. **Test SQL injection in login**:
   ```bash
   curl -X POST http://localhost:3000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin'\''--","password":"anything"}'
   ```

2. **Expected Result**:
   ```json
   {
     "statusCode": 400,
     "message": ["Invalid email format"],
     "error": "Bad Request"
   }
   ```

3. **Test with OR 1=1**:
   ```bash
   curl -X POST http://localhost:3000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@test.com OR 1=1--","password":"anything"}'
   ```

4. **Expected Result**: Validation rejects invalid email format

**Benefit**: Prevents SQL injection, protects database integrity

---

## Scenario 4: Weak Password Attack

### 🔴 Before Phase 10
Users could set weak passwords like "123456" or "password".

```bash
# Weak password accepted
POST /users
{
  "email": "user@example.com",
  "password": "123456",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Result**: Easy to crack, account compromise

### ✅ After Phase 10
Strong password requirements enforced (uppercase, lowercase, number, special char).

### 📝 How to Test

1. **Test weak password (too short)**:
   ```bash
   curl -X POST http://localhost:3000/users \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "short",
       "firstName": "John",
       "lastName": "Doe"
     }'
   ```

2. **Expected Result**:
   ```json
   {
     "statusCode": 400,
     "message": ["Password must be at least 8 characters"],
     "error": "Bad Request"
   }
   ```

3. **Test weak password (no special char)**:
   ```bash
   curl -X POST http://localhost:3000/users \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "Password123",
       "firstName": "John",
       "lastName": "Doe"
     }'
   ```

4. **Expected Result**:
   ```json
   {
     "statusCode": 400,
     "message": ["Password must contain uppercase, lowercase, number, and special character"],
     "error": "Bad Request"
   }
   ```

5. **Test strong password (accepted)**:
   ```bash
   curl -X POST http://localhost:3000/users \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "SecurePass123!",
       "firstName": "John",
       "lastName": "Doe"
     }'
   ```

**Benefit**: Enforces strong passwords, reduces account compromise risk

---

## Scenario 5: Security Headers Verification

### 🔴 Before Phase 10
Missing security headers leave application vulnerable.

### ✅ After Phase 10
Comprehensive security headers protect against various attacks.

### 📝 How to Test

1. **Check security headers**:
   ```bash
   curl -I http://localhost:3000/auth/status
   ```

2. **Expected Headers**:
   ```
   X-Content-Type-Options: nosniff
   X-Frame-Options: DENY (or ALLOWALL for whitelisted origins)
   X-XSS-Protection: 1; mode=block
   Strict-Transport-Security: max-age=31536000; includeSubDomains
   Content-Security-Policy: default-src 'self'; ...
   Referrer-Policy: strict-origin-when-cross-origin
   ```

3. **Test in browser DevTools**:
   - Open http://localhost:4200
   - Open DevTools (F12)
   - Go to Network tab
   - Click on any request
   - Check Response Headers

**Benefit**: Multiple layers of browser-level security protection

---

## Scenario 6: Input Validation - Email Bombing

### 🔴 Before Phase 10
Attackers could submit extremely long emails or invalid formats.

```bash
# 1000-character email
POST /auth/login
{
  "email": "a".repeat(1000) + "@test.com",
  "password": "password"
}
```

**Result**: Database overflow, performance issues

### ✅ After Phase 10
Email length limited to 255 characters, format validated.

### 📝 How to Test

1. **Test extremely long email**:
   ```bash
   curl -X POST http://localhost:3000/auth/login \
     -H "Content-Type: application/json" \
     -d "{\"email\":\"$(printf 'a%.0s' {1..300})@test.com\",\"password\":\"password123\"}"
   ```

2. **Expected Result**:
   ```json
   {
     "statusCode": 400,
     "message": ["Email must not exceed 255 characters"],
     "error": "Bad Request"
   }
   ```

3. **Test invalid email format**:
   ```bash
   curl -X POST http://localhost:3000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"not-an-email","password":"password123"}'
   ```

**Benefit**: Prevents database overflow and performance degradation

---

## Scenario 7: Security Event Logging

### 🔴 Before Phase 10
No visibility into security events, attacks go unnoticed.

### ✅ After Phase 10
All security events logged with context (IP, user agent, timestamp).

### 📝 How to Test

1. **Make various requests**:
   ```bash
   # Failed login
   curl -X POST http://localhost:3000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"wrong"}'

   # Successful login (if user exists)
   curl -X POST http://localhost:3000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"john.doe@example.com","password":"SecurePass123!"}'

   # CSRF token request
   curl http://localhost:3000/auth/csrf
   ```

2. **Check console logs**:
   - Look for `[SecurityLogger]` entries
   - See IP addresses, user agents, timestamps
   - Track authentication attempts

3. **In production, check log files**:
   ```bash
   # View security logs
   tail -f backend/logs/security-2026-05-26.log

   # View error logs
   tail -f backend/logs/error-2026-05-26.log
   ```

**Benefit**: Complete audit trail, detect and respond to attacks

---

## Scenario 8: Rate Limiting on Different Endpoints

### 📝 How to Test

1. **Test status endpoint (60 requests/minute)**:
   ```bash
   # Make 65 rapid requests
   for i in {1..65}; do
     curl http://localhost:3000/auth/status
     echo " - Request $i"
   done
   ```

2. **Expected Result**:
   - First 60 requests: Success (200 OK)
   - Requests 61-65: Rate limited (429 Too Many Requests)

3. **Test CSRF endpoint (no limit)**:
   ```bash
   # Make 100 requests - all should succeed
   for i in {1..100}; do
     curl http://localhost:3000/auth/csrf
   done
   ```

**Benefit**: Flexible rate limiting per endpoint, prevents API abuse

---

## Scenario 9: Production Error Message Sanitization

### 🔴 Before Phase 10
Detailed error messages expose internal structure.

```json
{
  "statusCode": 400,
  "message": "Validation failed for property 'email' with value '<script>alert(1)</script>@test.com'",
  "target": { "email": "<script>alert(1)</script>@test.com", "password": "..." }
}
```

**Result**: Information leakage, helps attackers

### ✅ After Phase 10
Production mode hides sensitive details.

### 📝 How to Test

1. **Set production mode**:
   ```bash
   export NODE_ENV=production
   npm run start:prod
   ```

2. **Make invalid request**:
   ```bash
   curl -X POST http://localhost:3000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"invalid","password":"test"}'
   ```

3. **Expected Result** (production):
   ```json
   {
     "statusCode": 400,
     "error": "Bad Request"
   }
   ```
   - No detailed validation messages
   - No target object exposed
   - No submitted values shown

**Benefit**: Prevents information leakage in production

---

## Scenario 10: Comprehensive Security Test Suite

### 📝 How to Test

1. **Run automated security tests**:
   ```bash
   cd backend
   npm run test:e2e -- security.e2e-spec.ts
   ```

2. **Tests include**:
   - ✅ Rate limiting enforcement
   - ✅ Invalid email format rejection
   - ✅ SQL injection prevention
   - ✅ XSS attack prevention
   - ✅ Password length validation
   - ✅ Security headers presence
   - ✅ CSP headers verification
   - ✅ CSRF token generation

3. **Expected Result**: All tests pass

**Benefit**: Automated security regression testing

---

## 📊 Summary of Benefits

| Security Feature | Attack Prevented | User Impact |
|-----------------|------------------|-------------|
| Rate Limiting | Brute force, DDoS | Faster, more stable app |
| Input Validation | SQL injection, XSS | Data integrity, safe browsing |
| Password Requirements | Weak passwords | Stronger account security |
| Security Headers | Clickjacking, XSS | Browser-level protection |
| Input Sanitization | XSS, HTML injection | Safe data display |
| Security Logging | All attacks | Incident response, compliance |
| Error Sanitization | Information leakage | Privacy protection |

---

## 🎓 Learning Exercise

Try these exercises to understand the security improvements:

### Exercise 1: Compare Before/After
1. Comment out the ThrottlerGuard in app.module.ts
2. Try making 10 rapid login attempts
3. Re-enable ThrottlerGuard
4. Try again - see the difference!

### Exercise 2: Test Password Strength
Try creating users with these passwords:
- ❌ "password" - Too weak
- ❌ "Password123" - Missing special char
- ❌ "Pass1!" - Too short
- ✅ "SecurePass123!" - Accepted

### Exercise 3: Monitor Security Logs
1. Make various requests (login, logout, CSRF)
2. Watch the console for [SecurityLogger] entries
3. See how each action is tracked

### Exercise 4: Test Security Headers
1. Open browser DevTools
2. Make a request to the API
3. Check Response Headers
4. Identify each security header and its purpose

---

## 🚀 Quick Test Script

Save this as `test-security.sh`:

```bash
#!/bin/bash

echo "=== Phase 10 Security Testing ==="
echo ""

echo "1. Testing Rate Limiting..."
for i in {1..4}; do
  echo "  Attempt $i:"
  curl -s -X POST http://localhost:3000/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}' | jq .
done

echo ""
echo "2. Testing XSS Prevention..."
curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"<script>alert(1)</script>@test.com","password":"test"}' | jq .

echo ""
echo "3. Testing SQL Injection Prevention..."
curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin'\''--","password":"test"}' | jq .

echo ""
echo "4. Testing Weak Password..."
curl -s -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"weak","firstName":"Test","lastName":"User"}' | jq .

echo ""
echo "5. Checking Security Headers..."
curl -I http://localhost:3000/auth/status 2>&1 | grep -E "X-|Content-Security|Strict-Transport"

echo ""
echo "=== Testing Complete ==="
```

Run with: `bash test-security.sh`

---

**Made with Bob 🤖**

Last updated: May 26, 2026