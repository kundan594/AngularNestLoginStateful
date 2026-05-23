#!/bin/bash

################################################################################
# Podman Compose Startup Script for Bob Login Application
################################################################################
# This script starts the authentication application services using Podman
# instead of Docker. It manages Redis and PostgreSQL containers.
#
# Prerequisites:
#   - Podman installed (https://podman.io/getting-started/installation)
#   - podman-compose installed (pip install podman-compose) OR Podman 4.0+
#
# Services:
#   - Redis (port 6379): Session storage
#   - PostgreSQL (port 5433): Database
################################################################################

set -e  # Exit on any error

# Always run relative to this script, even if it is launched from another folder.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"

# Windows Podman may delegate to podman-compose.exe, which is happiest with a
# Windows-style path when running from Git Bash.
if command -v cygpath >/dev/null 2>&1; then
    COMPOSE_FILE="$(cygpath -w "$COMPOSE_FILE")"
fi

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

################################################################################
# Pre-flight Checks
################################################################################

print_info "Starting pre-flight checks..."

# Check if Podman is installed
if ! command_exists podman; then
    print_error "Podman is not installed. Please install Podman first."
    print_info "Visit: https://podman.io/getting-started/installation"
    exit 1
fi

print_success "Podman is installed: $(podman --version)"

# Check for podman compose or podman-compose support
# Prioritize native podman compose (Podman 4.0+) for better Windows compatibility
COMPOSE_CMD=()

# First, try native podman compose (more reliable on Windows)
print_info "Checking for native podman compose support..."

# Try multiple detection methods for better Windows compatibility
COMPOSE_AVAILABLE=false

# Method 1: Check if 'podman compose --help' works
if podman compose --help >/dev/null 2>&1; then
    COMPOSE_AVAILABLE=true
    print_success "Detected native podman compose via --help"
# Method 2: Check if 'podman --help' shows compose subcommand
elif podman --help 2>&1 | grep -q "compose"; then
    COMPOSE_AVAILABLE=true
    print_success "Detected native podman compose via podman --help"
# Method 3: Try version command (may not work on all Windows builds)
elif podman compose version >/dev/null 2>&1; then
    COMPOSE_AVAILABLE=true
    print_success "Detected native podman compose via version command"
fi

if [ "$COMPOSE_AVAILABLE" = true ]; then
    COMPOSE_CMD=(podman compose)
    print_success "Using native podman compose (Podman 4.0+)"
    print_info "This is the recommended method for Windows"
else
    # Fallback to podman-compose if native compose is not available
    print_warning "Native podman compose not available, checking for podman-compose..."
    if command_exists podman-compose; then
        print_error "podman-compose is installed but has known compatibility issues on Windows."
        print_error "Please use native 'podman compose' instead."
        print_info "Your Podman version should support it. Try: podman compose --help"
        exit 1
    else
        print_error "Neither podman compose nor podman-compose is available."
        print_info "Upgrade to Podman 4.0+ for native compose support"
        exit 1
    fi
fi

# Check if Podman machine is running (Windows/macOS requirement)
print_info "Checking Podman machine status..."
if podman machine list >/dev/null 2>&1; then
    # Podman machine commands are available (Windows/macOS)
    MACHINE_STATUS=$(podman machine list --format "{{.Running}}" 2>/dev/null | head -n 1)
    
    if [ "$MACHINE_STATUS" != "true" ]; then
        print_warning "Podman machine is not running. Attempting to start..."
        
        # Check if a machine exists
        MACHINE_EXISTS=$(podman machine list --format "{{.Name}}" 2>/dev/null | head -n 1)
        
        if [ -z "$MACHINE_EXISTS" ]; then
            print_info "No Podman machine found. Initializing default machine..."
            podman machine init
            if [ $? -ne 0 ]; then
                print_error "Failed to initialize Podman machine"
                print_info "Please run: podman machine init && podman machine start"
                exit 1
            fi
        fi
        
        print_info "Starting Podman machine..."
        podman machine start
        
        if [ $? -eq 0 ]; then
            print_success "Podman machine started successfully"
            # Wait a moment for the machine to be fully ready
            sleep 3
        else
            print_error "Failed to start Podman machine"
            print_info "Please run: podman machine start"
            exit 1
        fi
    else
        print_success "Podman machine is running"
    fi
else
    # Linux - no machine needed
    print_info "Running on Linux (no Podman machine required)"
fi

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    print_error "docker-compose.yml not found in current directory"
    exit 1
fi

print_success "docker-compose.yml found"

################################################################################
# Environment Setup
################################################################################

print_info "Setting up environment..."

# Set default database password if not already set
if [ -z "$DB_PASSWORD" ]; then
    export DB_PASSWORD="devpassword123"
    print_warning "DB_PASSWORD not set, using default: devpassword123"
else
    print_success "Using DB_PASSWORD from environment"
fi

################################################################################
# Start Services
################################################################################

print_info "Starting services with Podman..."
echo ""
# Stop any existing containers (optional, comment out if not desired)
print_info "Stopping any existing containers..."
# Native podman compose handles this correctly on Windows
"${COMPOSE_CMD[@]}" -f "$COMPOSE_FILE" down 2>/dev/null || true

# Start services in detached mode
print_info "Bringing up services..."
"${COMPOSE_CMD[@]}" -f "$COMPOSE_FILE" up -d

if [ $? -eq 0 ]; then
    print_success "Services started successfully!"
else
    print_error "Failed to start services"
    exit 1
fi

echo ""
print_info "Waiting for services to be healthy..."
sleep 5

################################################################################
# Service Status Check
################################################################################

print_info "Checking service status..."
echo ""

# List running containers
"${COMPOSE_CMD[@]}" -f "$COMPOSE_FILE" ps

echo ""

################################################################################
# Health Checks
################################################################################

print_info "Performing health checks..."

# Check Redis
print_info "Checking Redis connection..."
if podman exec auth-redis redis-cli ping >/dev/null 2>&1; then
    print_success "Redis is responding (port 6379)"
else
    print_warning "Redis health check failed - it may still be starting up"
fi

# Check PostgreSQL
print_info "Checking PostgreSQL connection..."
if podman exec auth-postgres pg_isready -U authuser -d authdb >/dev/null 2>&1; then
    print_success "PostgreSQL is ready (port 5433)"
else
    print_warning "PostgreSQL health check failed - it may still be starting up"
fi

################################################################################
# Summary
################################################################################

echo ""
echo "========================================================================"
print_success "Podman Compose startup complete!"
echo "========================================================================"
echo ""
echo "Services running:"
echo "  - Redis:      localhost:6379 (container: auth-redis)"
echo "  - PostgreSQL: localhost:5433 (container: auth-postgres)"
echo ""
echo "Database credentials:"
echo "  - Database:   authdb"
echo "  - User:       authuser"
echo "  - Password:   ${DB_PASSWORD}"
echo ""
echo "Useful commands:"
echo "  - View logs:           podman compose -f \"$COMPOSE_FILE\" logs -f"
echo "  - View specific logs:  podman compose -f \"$COMPOSE_FILE\" logs -f redis"
echo "  - Stop services:       podman compose -f \"$COMPOSE_FILE\" down"
echo "  - Restart services:    podman compose -f \"$COMPOSE_FILE\" restart"
echo "  - Check status:        podman compose -f \"$COMPOSE_FILE\" ps"
echo ""
echo "Next steps:"
echo "  1. Start the backend:  cd backend && npm install && npm run start:dev"
echo "  2. Start the frontend: cd frontend && npm install && npm start"
echo "  3. Access the app:     http://localhost:4200"
echo ""
echo "========================================================================"

# Made with Bob
