# Deployment Guide

This guide provides step-by-step instructions for deploying the Angular + NestJS Authentication System to production.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Docker Deployment](#docker-deployment)
- [Manual Deployment](#manual-deployment)
- [SSL/TLS Configuration](#ssltls-configuration)
- [Monitoring and Logging](#monitoring-and-logging)
- [Backup and Recovery](#backup-and-recovery)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

- Docker 20.10+ and Docker Compose 2.0+
- Node.js 18+ (for manual deployment)
- PostgreSQL 15+ (for manual deployment)
- Redis 7+ (for manual deployment)
- Nginx (for reverse proxy)

### Domain and SSL

- Registered domain name
- SSL/TLS certificate (Let's Encrypt recommended)
- DNS configured to point to your server

## Environment Configuration

### 1. Backend Environment Variables

Create a `.env` file in the `backend` directory:

```bash
# Copy the production template
cp backend/.env.production backend/.env

# Edit with your production values
nano backend/.env
```

**Critical Variables to Change:**

```env
# Database
DB_PASSWORD=<strong-random-password>

# Redis
REDIS_PASSWORD=<strong-random-password>

# Session
SESSION_SECRET=<generate-random-64-char-string>

# CORS
FRONTEND_URL=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

**Generate Strong Secrets:**

```bash
# Generate SESSION_SECRET
openssl rand -base64 64

# Generate passwords
openssl rand -base64 32
```

### 2. Frontend Environment Variables

Create `frontend/.env.production`:

```env
API_URL=https://api.yourdomain.com
SESSION_DURATION=1800000
WARNING_BEFORE_EXPIRY=120000
ENABLE_CROSS_TAB_SYNC=true
ENABLE_SESSION_KEEPALIVE=true
ENABLE_SESSION_WARNING=true
PRODUCTION=true
```

### 3. Docker Compose Environment

Create `.env` in the root directory for docker-compose:

```env
# Database
DB_NAME=authdb
DB_USER=authuser
DB_PASSWORD=<your-db-password>

# Redis
REDIS_PASSWORD=<your-redis-password>

# Session
SESSION_SECRET=<your-session-secret>

# CORS
FRONTEND_URL=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

## Docker Deployment

### Option 1: Using Docker Compose (Recommended)

#### Step 1: Build Images

```bash
# Build all services
docker-compose -f docker-compose.prod.yml build

# Or build individually
docker-compose -f docker-compose.prod.yml build backend
docker-compose -f docker-compose.prod.yml build frontend
```

#### Step 2: Start Services

```bash
# Start all services in detached mode
docker-compose -f docker-compose.prod.yml up -d

# Check service status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

#### Step 3: Run Database Migrations

```bash
# Access backend container
docker exec -it auth-backend-prod sh

# Run migrations
npm run migration:run

# Exit container
exit
```

#### Step 4: Verify Deployment

```bash
# Check backend health
curl http://localhost:3000/health

# Check frontend health
curl http://localhost:80/health

# Check all services
docker-compose -f docker-compose.prod.yml ps
```

### Option 2: Individual Docker Containers

#### Backend

```bash
# Build
docker build -t auth-backend:latest ./backend

# Run
docker run -d \
  --name auth-backend \
  --env-file backend/.env \
  -p 3000:3000 \
  --network auth-network \
  auth-backend:latest
```

#### Frontend

```bash
# Build
docker build -t auth-frontend:latest ./frontend

# Run
docker run -d \
  --name auth-frontend \
  -p 80:80 \
  --network auth-network \
  auth-frontend:latest
```

## Manual Deployment

### Backend Deployment

#### Step 1: Install Dependencies

```bash
cd backend
npm ci --only=production
```

#### Step 2: Build Application

```bash
npm run build
```

#### Step 3: Run Migrations

```bash
npm run migration:run
```

#### Step 4: Start Application

```bash
# Using PM2 (recommended)
npm install -g pm2
pm2 start dist/main.js --name auth-backend

# Or using systemd
sudo systemctl start auth-backend
```

### Frontend Deployment

#### Step 1: Build Application

```bash
cd frontend
npm ci
npm run build -- --configuration production
```

#### Step 2: Deploy to Web Server

```bash
# Copy build files to nginx
sudo cp -r dist/frontend/* /var/www/html/

# Or use the nginx.conf provided
sudo cp nginx.conf /etc/nginx/nginx.conf
sudo nginx -t
sudo systemctl reload nginx
```

## SSL/TLS Configuration

### Using Let's Encrypt with Certbot

#### Step 1: Install Certbot

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum install certbot python3-certbot-nginx
```

#### Step 2: Obtain Certificate

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

#### Step 3: Auto-Renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Certbot automatically sets up a cron job for renewal
```

### Manual SSL Configuration

Update `frontend/nginx.conf`:

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/ssl/certs/yourdomain.com.crt;
    ssl_certificate_key /etc/ssl/private/yourdomain.com.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # ... rest of configuration
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

## Monitoring and Logging

### Docker Logs

```bash
# View all logs
docker-compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend

# Save logs to file
docker-compose -f docker-compose.prod.yml logs > deployment.log
```

### Application Logs

Backend logs are stored in:
- Docker: Container stdout/stderr
- Manual: Check PM2 logs or systemd journal

```bash
# PM2 logs
pm2 logs auth-backend

# Systemd logs
sudo journalctl -u auth-backend -f
```

### Health Checks

```bash
# Backend health
curl https://api.yourdomain.com/health

# Frontend health
curl https://yourdomain.com/health

# Database connection
docker exec -it auth-postgres-prod psql -U authuser -d authdb -c "SELECT 1;"

# Redis connection
docker exec -it auth-redis-prod redis-cli ping
```

## Backup and Recovery

### Database Backup

```bash
# Create backup
docker exec auth-postgres-prod pg_dump -U authuser authdb > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
docker exec -i auth-postgres-prod psql -U authuser authdb < backup_20260527_120000.sql
```

### Redis Backup

```bash
# Redis automatically saves to /data with AOF enabled
# Copy backup file
docker cp auth-redis-prod:/data/appendonly.aof ./redis_backup_$(date +%Y%m%d_%H%M%S).aof
```

### Automated Backups

Create a backup script (`backup.sh`):

```bash
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Database backup
docker exec auth-postgres-prod pg_dump -U authuser authdb > "$BACKUP_DIR/db_$DATE.sql"

# Redis backup
docker cp auth-redis-prod:/data/appendonly.aof "$BACKUP_DIR/redis_$DATE.aof"

# Compress backups
tar -czf "$BACKUP_DIR/backup_$DATE.tar.gz" "$BACKUP_DIR/db_$DATE.sql" "$BACKUP_DIR/redis_$DATE.aof"

# Remove old backups (keep last 7 days)
find "$BACKUP_DIR" -name "backup_*.tar.gz" -mtime +7 -delete

echo "Backup completed: backup_$DATE.tar.gz"
```

Add to crontab:

```bash
# Run daily at 2 AM
0 2 * * * /path/to/backup.sh
```

## Troubleshooting

### Common Issues

#### 1. CORS Errors

**Symptom:** Browser console shows CORS policy errors

**Solution:**
- Verify `ALLOWED_ORIGINS` includes your frontend domain
- Check that `credentials: true` is set in CORS config
- Ensure frontend is using HTTPS if backend requires secure cookies

#### 2. Session Not Persisting

**Symptom:** User logged out after page refresh

**Solution:**
- Check Redis is running: `docker ps | grep redis`
- Verify Redis connection in backend logs
- Ensure `SESSION_SECURE=true` only in HTTPS environments
- Check cookie domain settings

#### 3. Database Connection Failed

**Symptom:** Backend fails to start with database errors

**Solution:**
- Verify PostgreSQL is running: `docker ps | grep postgres`
- Check database credentials in `.env`
- Ensure database exists: `docker exec -it auth-postgres-prod psql -U authuser -l`
- Check network connectivity between containers

#### 4. Build Failures

**Symptom:** Docker build fails

**Solution:**
- Clear Docker cache: `docker system prune -a`
- Check Dockerfile syntax
- Verify all dependencies in package.json
- Ensure sufficient disk space

### Logs Analysis

```bash
# Check for errors in backend
docker-compose -f docker-compose.prod.yml logs backend | grep -i error

# Check for errors in frontend
docker-compose -f docker-compose.prod.yml logs frontend | grep -i error

# Monitor real-time logs
docker-compose -f docker-compose.prod.yml logs -f --tail=100
```

### Performance Issues

```bash
# Check resource usage
docker stats

# Check container health
docker inspect auth-backend-prod | grep -A 10 Health

# Check database performance
docker exec -it auth-postgres-prod psql -U authuser -d authdb -c "SELECT * FROM pg_stat_activity;"
```

## Security Checklist

- [ ] All environment variables use strong, random values
- [ ] SSL/TLS certificates are valid and auto-renewing
- [ ] Firewall configured to allow only necessary ports
- [ ] Database and Redis passwords are strong and unique
- [ ] SESSION_SECRET is a random 64+ character string
- [ ] CORS origins are explicitly whitelisted
- [ ] Security headers are properly configured
- [ ] Regular backups are automated and tested
- [ ] Logs are monitored for suspicious activity
- [ ] Dependencies are regularly updated
- [ ] Non-root users are used in Docker containers

## Maintenance

### Update Application

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Run new migrations if any
docker exec -it auth-backend-prod npm run migration:run
```

### Scale Services

```bash
# Scale backend to 3 instances
docker-compose -f docker-compose.prod.yml up -d --scale backend=3

# Use load balancer (nginx) to distribute traffic
```

### Monitor Resources

```bash
# Check disk usage
df -h

# Check memory usage
free -h

# Check Docker disk usage
docker system df
```

## Support

For issues and questions:
- Check logs first
- Review this guide
- Check GitHub issues
- Contact support team

---

**Made with Bob**