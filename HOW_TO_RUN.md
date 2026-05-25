# How to Run the Bob Login Application

This guide explains how to run the Bob Login application using Podman instead of Docker.

## Prerequisites

### 1. Install Podman (Windows 11)

**Option A: Using Podman Desktop (Recommended)**
```powershell
winget install RedHat.Podman-Desktop
```

**Option B: Manual Installation**
- Download from: https://podman.io/getting-started/installation
- Follow the Windows installation instructions

### 2. Install podman-compose

```powershell
pip install podman-compose
```

*Note: If you have Podman 4.0+, you can use `podman compose` instead*

### 3. Install Git Bash (to run shell scripts)

```powershell
winget install Git.Git
```

Or download from: https://git-scm.com/download/win

### 4. Install Node.js (for backend and frontend)

```powershell
winget install OpenJS.NodeJS.LTS
```

Or download from: https://nodejs.org/

## Quick Start

### Step 1: Start Infrastructure Services (Redis & PostgreSQL)

Open **Git Bash** in the project root directory and run:

```bash
# Make the script executable
chmod +x script.sh

# Run the script
./script.sh
```

The script will:
- ✅ Check if Podman is installed
- ✅ Start Redis on port 6379
- ✅ Start PostgreSQL on port 5433
- ✅ Perform health checks
- ✅ Display service status

**Expected Output:**
```
[SUCCESS] Podman Compose startup complete!

Services running:
  - Redis:      localhost:6379 (container: auth-redis)
  - PostgreSQL: localhost:5433 (container: auth-postgres)
```

### Step 2: Start the Backend (NestJS)

Open a **new terminal** (PowerShell or Git Bash):

```bash
# Navigate to backend directory
cd backend

# Install dependencies (first time only)
npm install

# Copy environment file (first time only)
cp .env.example .env

npm install
npm run migration:run
npm run seed
npm run start:dev

# Start the backend in development mode
npm run start:dev


npm install
npm run migration:run
npm run seed
npm run start:dev


 console.log('  - admin@example.com / Admin123!');
  console.log('  - john.doe@example.com / Password123!');
  console.log('  - jane.smith@example.com / Password123!');


  curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!"}'


  
# Test login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!"}' \
  -c cookies.txt

# Check session
curl -X GET http://localhost:3000/auth/session -b cookies.txt

# Logout
curl -X POST http://localhost:3000/auth/logout -b cookies.txt
```

**Expected Output:**
```
[Nest] Application successfully started
[Nest] Listening on port 3000
```

Backend will be available at: **http://localhost:3000**

### Step 3: Start the Frontend (Angular)

Open **another new terminal** (PowerShell or Git Bash):

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (first time only)
npm install

# Copy environment file (first time only)
cp .env.example .env

# Start the frontend development server
npm start
```

**Expected Output:**
```
✔ Browser application bundle generation complete.
** Angular Live Development Server is listening on localhost:4200 **
```

Frontend will be available at: **http://localhost:4200**

## Verification

### Check if Services are Running

**1. Check Podman containers:**
```bash
podman ps
```

You should see:
- `auth-redis` (Redis)
- `auth-postgres` (PostgreSQL)

**2. Test Redis:**
```bash
podman exec auth-redis redis-cli ping
```
Expected: `PONG`

**3. Test PostgreSQL:**
```bash
podman exec auth-postgres pg_isready -U authuser -d authdb
```
Expected: `accepting connections`

**4. Check Backend API:**
Open browser: http://localhost:3000
Or use curl:
```bash
curl http://localhost:3000
```

**5. Check Frontend:**
Open browser: http://localhost:4200

## Database Credentials

- **Database Name:** `authdb`
- **Username:** `authuser`
- **Password:** `devpassword123` (default)
- **Host:** `localhost`
- **Port:** `5433`

To change the password, set the `DB_PASSWORD` environment variable before running `script.sh`:

```bash
export DB_PASSWORD="your_secure_password"
./script.sh
```

## Useful Commands

### View Logs

**All services:**
```bash
podman compose -f docker-compose.yml logs -f
```

**Specific service:**
```bash
podman compose -f docker-compose.yml logs -f redis
podman compose -f docker-compose.yml logs -f postgres
```

**Backend logs:**
Check the terminal where you ran `npm run start:dev`

**Frontend logs:**
Check the terminal where you ran `npm start`

### Stop Services

**Stop infrastructure (Redis & PostgreSQL):**
```bash
podman compose -f docker-compose.yml down
```

**Stop backend:**
Press `Ctrl+C` in the backend terminal

**Stop frontend:**
Press `Ctrl+C` in the frontend terminal

### Restart Services

**Restart infrastructure:**
```bash
podman compose -f docker-compose.yml restart
```

**Restart specific service:**
```bash
podman compose -f docker-compose.yml restart redis
podman compose -f docker-compose.yml restart postgres
```

### Check Service Status

```bash
podman compose -f docker-compose.yml ps
```

## Troubleshooting

### Issue: "Podman not found"
**Solution:** Install Podman Desktop or ensure Podman is in your PATH

### Issue: "Port already in use"
**Solution:** Check if Docker or another service is using the ports:
```powershell
# Check port 6379 (Redis)
netstat -ano | findstr :6379

# Check port 5433 (PostgreSQL)
netstat -ano | findstr :5433

# Check port 3000 (Backend)
netstat -ano | findstr :3000

# Check port 4200 (Frontend)
netstat -ano | findstr :4200
```

Stop the conflicting service or change the port in `docker-compose.yml`

### Issue: "Cannot connect to Podman"
**Solution:** 
1. Make sure Podman Desktop is running
2. Restart Podman machine:
   ```powershell
   podman machine stop
   podman machine start
   ```

### Issue: "npm: command not found"
**Solution:** Install Node.js and restart your terminal

### Issue: Backend can't connect to Redis/PostgreSQL
**Solution:** 
1. Verify services are running: `podman ps`
2. Check backend `.env` file has correct connection strings
3. Restart backend: `npm run start:dev`

### Issue: Frontend can't connect to Backend
**Solution:**
1. Verify backend is running on port 3000
2. Check `frontend/proxy.conf.json` configuration
3. Clear browser cache and reload

## Development Workflow

### Daily Startup Sequence

1. **Start infrastructure:**
   ```bash
   ./script.sh
   ```

2. **Start backend:**
   ```bash
   cd backend && npm run start:dev
   ```

3. **Start frontend:**
   ```bash
   cd frontend && npm start
   ```

### Daily Shutdown Sequence

1. Stop frontend: `Ctrl+C` in frontend terminal
2. Stop backend: `Ctrl+C` in backend terminal
3. Stop infrastructure:
   ```bash
   podman compose -f docker-compose.yml down
   ```

## Alternative: Using PowerShell

If you prefer PowerShell over Git Bash, you can run the services manually:

```powershell
# Start services
podman compose -f docker-compose.yml up -d

# Check status
podman compose -f docker-compose.yml ps

# View logs
podman compose -f docker-compose.yml logs -f

# Stop services
podman compose -f docker-compose.yml down
```

Then follow Steps 2 and 3 from the Quick Start guide.

## Project Structure

```
bobLogin/
├── script.sh              # Podman startup script
├── docker-compose.yml     # Service definitions
├── backend/               # NestJS backend
│   ├── .env.example      # Backend environment template
│   └── src/              # Backend source code
├── frontend/              # Angular frontend
│   ├── .env.example      # Frontend environment template
│   └── src/              # Frontend source code
└── HOW_TO_RUN.md         # This file
```

## Additional Resources

- **Podman Documentation:** https://docs.podman.io/
- **NestJS Documentation:** https://docs.nestjs.com/
- **Angular Documentation:** https://angular.io/docs
- **Redis Documentation:** https://redis.io/docs/
- **PostgreSQL Documentation:** https://www.postgresql.org/docs/

## Support

If you encounter issues not covered in this guide:
1. Check the logs: `podman compose -f docker-compose.yml logs -f`
2. Verify all prerequisites are installed
3. Ensure all ports are available
4. Try restarting all services

---

**Made with Bob** 🚀
