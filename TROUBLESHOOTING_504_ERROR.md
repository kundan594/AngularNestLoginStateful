# Troubleshooting 504 Gateway Timeout Error

## Problem
When accessing `http://localhost:4200/api/auth/csrf`, you receive a **504 Gateway Timeout** error.

## Root Cause
The Angular development server (running on port 4200) is configured to proxy API requests to the backend server (port 3000), but the backend server is not running.

## Solution

### Step 1: Start the Infrastructure Services

First, ensure Docker services (PostgreSQL and Redis) are running:

```bash
# Start Docker services
docker-compose up -d

# Verify services are running
docker-compose ps
```

You should see:
- `auth-postgres` - running on port 5433
- `auth-redis` - running on port 6379

### Step 2: Configure Backend Environment

Ensure you have a `.env` file in the `backend` directory:

```bash
# Copy the example file
cp backend/.env.example backend/.env
```

The `.env` file should contain:
```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5433
DB_NAME=authdb
DB_USER=authuser
DB_PASSWORD=devpassword123
REDIS_HOST=localhost
REDIS_PORT=6379
SESSION_SECRET=your-super-secret-session-key-change-this-in-production
FRONTEND_URL=http://localhost:4200
ALLOWED_ORIGINS=http://localhost:4200
```

### Step 3: Start the Backend Server

Open a new terminal and run:

```bash
# Navigate to backend directory
cd backend

# Install dependencies (if not already done)
npm install

# Start the backend in development mode
npm run start:dev
```

You should see output like:
```
🚀 Application is running on: http://localhost:3000
```

### Step 4: Verify Backend is Running

In another terminal or browser, test the backend directly:

```bash
# Test health endpoint
curl http://localhost:3000/health

# Test CSRF endpoint
curl http://localhost:3000/auth/csrf
```

### Step 5: Start the Frontend (if not already running)

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (if not already done)
npm install

# Start the Angular dev server
npm start
```

The frontend will be available at `http://localhost:4200`

### Step 6: Test the Application

Now try accessing:
- `http://localhost:4200` - Frontend should load
- `http://localhost:4200/api/auth/csrf` - Should return CSRF token (proxied to backend)

## Quick Start Script

For convenience, you can use the provided script:

```bash
# Make script executable (Linux/Mac)
chmod +x script.sh

# Run the script
./script.sh
```

Or manually run all services:

```bash
# Terminal 1: Start Docker services
docker-compose up

# Terminal 2: Start backend
cd backend && npm run start:dev

# Terminal 3: Start frontend
cd frontend && npm start
```

## Common Issues

### Issue 1: Port 3000 Already in Use
**Error:** `Error: listen EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
# Find process using port 3000
# Windows PowerShell:
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess

# Linux/Mac:
lsof -i :3000

# Kill the process or change the port in backend/.env
PORT=3001
```

### Issue 2: Database Connection Failed
**Error:** `Error: connect ECONNREFUSED 127.0.0.1:5433`

**Solution:**
```bash
# Ensure Docker services are running
docker-compose ps

# If not running, start them
docker-compose up -d

# Check PostgreSQL logs
docker-compose logs postgres
```

### Issue 3: Redis Connection Failed
**Error:** `Error: Redis connection to localhost:6379 failed`

**Solution:**
```bash
# Check Redis is running
docker-compose ps redis

# Test Redis connection
docker exec -it auth-redis redis-cli ping
# Should return: PONG

# Check Redis logs
docker-compose logs redis
```

### Issue 4: CORS Errors After Starting Backend
**Error:** `Access to XMLHttpRequest has been blocked by CORS policy`

**Solution:**
Ensure `ALLOWED_ORIGINS` in `backend/.env` includes your frontend URL:
```env
ALLOWED_ORIGINS=http://localhost:4200
```

Then restart the backend server.

## Verification Checklist

- [ ] Docker services running (`docker-compose ps`)
- [ ] Backend server running on port 3000
- [ ] Frontend server running on port 4200
- [ ] Backend `.env` file exists and configured
- [ ] Can access `http://localhost:3000/health` directly
- [ ] Can access `http://localhost:4200` (frontend)
- [ ] Can access `http://localhost:4200/api/auth/csrf` (proxied)

## Still Having Issues?

1. **Check all logs:**
   ```bash
   # Docker services
   docker-compose logs -f
   
   # Backend logs (in backend terminal)
   # Frontend logs (in frontend terminal)
   ```

2. **Restart everything:**
   ```bash
   # Stop all services
   docker-compose down
   # Stop backend (Ctrl+C in backend terminal)
   # Stop frontend (Ctrl+C in frontend terminal)
   
   # Start fresh
   docker-compose up -d
   cd backend && npm run start:dev
   cd frontend && npm start
   ```

3. **Check the HOW_TO_RUN.md guide** for detailed setup instructions

---

**Made with Bob**