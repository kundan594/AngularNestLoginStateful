# Angular Proxy Configuration - Detailed Explanation

## Overview
This document explains how the Angular development proxy works to connect the frontend (Angular) with the backend (NestJS) during development.

## The Problem

### Development Setup:
- **Frontend (Angular):** Runs on `http://localhost:4200`
- **Backend (NestJS):** Runs on `http://localhost:3000`

### The Issue:
When the frontend tries to make API calls directly to `http://localhost:3000`, browsers block these requests due to **CORS (Cross-Origin Resource Sharing)** policy. This is a security feature that prevents websites from making requests to different origins.

## The Solution: Angular Proxy

Angular CLI provides a built-in proxy server that acts as a "middleman" between your frontend and backend during development.

## How It Works

### 1. Configuration Files

#### `frontend/src/environments/environment.ts`
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:4200/api',  // Points to SAME origin with /api prefix
};
```

#### `frontend/proxy.conf.json`
```json
{
  "/api": {
    "target": "http://localhost:3000",
    "secure": false,
    "changeOrigin": true,
    "pathRewrite": {
      "^/api": ""
    },
    "logLevel": "debug"
  }
}
```

### 2. Request Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: Frontend Code Makes Request                            │
├─────────────────────────────────────────────────────────────────┤
│ CsrfService.fetchToken() calls:                                │
│ http.get('http://localhost:4200/api/auth/csrf')                │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 2: Browser Sends Request                                  │
├─────────────────────────────────────────────────────────────────┤
│ GET http://localhost:4200/api/auth/csrf                        │
│ (Same origin - no CORS issues!)                                │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 3: Angular Dev Server Intercepts                          │
├─────────────────────────────────────────────────────────────────┤
│ Checks proxy.conf.json:                                        │
│ - Matches "/api" pattern                                       │
│ - Target: http://localhost:3000                                │
│ - PathRewrite: Remove "/api" prefix                            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 4: Path Rewriting                                         │
├─────────────────────────────────────────────────────────────────┤
│ Original:  /api/auth/csrf                                      │
│ Rewrite:   /auth/csrf  (removed /api)                          │
│ Final URL: http://localhost:3000/auth/csrf                     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 5: Backend Receives Request                               │
├─────────────────────────────────────────────────────────────────┤
│ NestJS receives: GET http://localhost:3000/auth/csrf           │
│ Processes request and returns CSRF token                       │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 6: Response Returns to Browser                            │
├─────────────────────────────────────────────────────────────────┤
│ Browser receives response from localhost:4200                  │
│ Frontend code processes the CSRF token                         │
└─────────────────────────────────────────────────────────────────┘
```

## Proxy Configuration Breakdown

### `"/api"` - URL Pattern
- Matches any request starting with `/api`
- Examples that match:
  - `/api/auth/csrf` ✅
  - `/api/auth/login` ✅
  - `/api/users` ✅
- Examples that don't match:
  - `/auth/csrf` ❌
  - `/users` ❌

### `"target": "http://localhost:3000"`
- The destination server where requests should be forwarded
- This is your NestJS backend server

### `"secure": false`
- Allows proxy to work with non-HTTPS targets
- Set to `true` in production with HTTPS

### `"changeOrigin": true`
- Changes the origin header to match the target
- Required for virtual hosted sites

### `"pathRewrite": { "^/api": "" }`
- **Regex pattern:** `^/api` means "starts with /api"
- **Replacement:** `""` (empty string) means remove it
- **Example transformations:**
  ```
  /api/auth/csrf  →  /auth/csrf
  /api/users      →  /users
  /api/auth/login →  /auth/login
  ```

### `"logLevel": "debug"`
- Prints proxy activity to console
- Useful for debugging
- Options: `"debug"`, `"info"`, `"warn"`, `"error"`, `"silent"`

## Real-World Example

### Frontend Service Code:
```typescript
// frontend/src/app/core/services/csrf.service.ts
fetchToken(): Observable<CsrfResponse> {
  return this.http.get<CsrfResponse>(`${this.apiUrl}/auth/csrf`);
  // apiUrl = 'http://localhost:4200/api'
  // Full URL: http://localhost:4200/api/auth/csrf
}
```

### What Actually Happens:
1. **Browser sees:** `http://localhost:4200/api/auth/csrf`
2. **Proxy intercepts:** Matches `/api` pattern
3. **Proxy rewrites:** Removes `/api` → `/auth/csrf`
4. **Proxy forwards to:** `http://localhost:3000/auth/csrf`
5. **Backend receives:** `GET /auth/csrf`
6. **Backend responds:** `{ csrfToken: "abc123..." }`
7. **Browser receives:** Response from `localhost:4200`

## Why This Approach?

### ✅ Advantages:
1. **No CORS Issues:** Browser thinks everything is same-origin
2. **Simple Frontend Code:** No need to handle different URLs for dev/prod
3. **Transparent:** Frontend doesn't know about the proxy
4. **Secure Cookies:** Session cookies work correctly
5. **Easy Development:** No need to configure CORS in development

### ⚠️ Important Notes:
1. **Development Only:** This proxy only works with `ng serve`
2. **Must Restart:** Changes to `proxy.conf.json` require restarting Angular dev server
3. **Production Different:** In production, use nginx or similar reverse proxy

## Starting the Application

### With Proxy (Correct Way):
```bash
cd frontend
npm start
# or
ng serve --proxy-config proxy.conf.json
```

The `angular.json` file is already configured to use the proxy:
```json
"serve": {
  "options": {
    "proxyConfig": "proxy.conf.json"
  }
}
```

## Troubleshooting

### Issue: 404 Not Found on API Calls
**Cause:** Proxy not configured or not running
**Solution:** 
1. Check `proxy.conf.json` exists
2. Restart Angular dev server
3. Check backend is running on port 3000

### Issue: CORS Errors
**Cause:** Proxy not intercepting requests
**Solution:**
1. Verify `apiUrl` in environment.ts uses `/api` prefix
2. Check proxy pattern matches your URLs
3. Restart Angular dev server

### Issue: Changes Not Working
**Cause:** Proxy config cached
**Solution:**
1. Stop Angular dev server (Ctrl+C)
2. Clear browser cache
3. Restart: `npm start`

## Production Configuration

In production, you won't use Angular's proxy. Instead:

### Option 1: Nginx Reverse Proxy
```nginx
server {
    listen 80;
    server_name example.com;

    location / {
        proxy_pass http://localhost:4200;  # Angular
    }

    location /api {
        rewrite ^/api/(.*) /$1 break;
        proxy_pass http://localhost:3000;  # NestJS
    }
}
```

### Option 2: Same Server
Deploy both frontend and backend on the same domain:
- Frontend: `https://example.com`
- Backend: `https://example.com/api`

### Option 3: Different Domains with CORS
- Frontend: `https://app.example.com`
- Backend: `https://api.example.com`
- Configure CORS on backend to allow frontend domain

## Summary

The Angular proxy is a development tool that:
1. Intercepts requests to `/api/*`
2. Forwards them to the backend server
3. Rewrites the path to remove `/api`
4. Returns the response to the browser

This allows seamless development without CORS issues while keeping the frontend and backend on different ports.

---

**Created:** 2026-05-24
**Last Updated:** 2026-05-24
**Related Files:**
- `frontend/proxy.conf.json`
- `frontend/src/environments/environment.ts`
- `frontend/angular.json`