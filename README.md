# Angular + NestJS Authentication System

A production-ready authentication system featuring stateful session management with Redis, CSRF protection, and cross-tab synchronization.

## Overview

This project implements a secure, enterprise-grade authentication system using modern web technologies. It provides a robust foundation for applications requiring secure user authentication with advanced session management capabilities.

## Technology Stack

### Backend
- **NestJS** - Progressive Node.js framework
- **TypeScript** - Type-safe development
- **PostgreSQL** - Relational database
- **Redis** - Session storage and caching
- **Passport.js** - Authentication middleware
- **express-session** - Session management

### Frontend
- **Angular 17+** - Modern web framework
- **TypeScript** - Type-safe development
- **RxJS** - Reactive programming
- **Angular Material** - UI components

### Infrastructure
- **Docker & Docker Compose** - Containerization
- **Redis 7** - In-memory data store
- **PostgreSQL 15** - Database server

## Key Features

- ✅ **Stateful Session Management** - Server-side sessions with Redis
- ✅ **CSRF Protection** - Double-submit cookie pattern
- ✅ **Cross-Tab Synchronization** - Broadcast Channel API for multi-tab support
- ✅ **Session Keepalive** - Automatic session extension on user activity
- ✅ **Session Warning Dialog** - Proactive expiry notifications
- ✅ **Iframe Session Validation** - Secure embedded content handling
- ✅ **Security Headers** - Helmet.js integration
- ✅ **Rate Limiting** - Brute-force protection
- ✅ **CORS Configuration** - Secure cross-origin requests

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Docker and Docker Compose
- Git

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bobLogin
   ```

2. **Start infrastructure services**
   ```bash
   docker-compose up -d
   ```

3. **Backend setup**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your configuration
   npm install
   npm run start:dev
   ```

4. **Frontend setup**
   ```bash
   cd frontend
   npm install
   npm start
   ```

5. **Access the application**
   - Frontend: http://localhost:4200
   - Backend API: http://localhost:3000

## Project Structure

```
bobLogin/
├── backend/          # NestJS backend application
├── frontend/         # Angular frontend application
├── docker-compose.yml
├── README.md
└── PROJECT_SPECIFICATION.md
```

## Documentation

For detailed technical specifications, architecture decisions, and implementation guidelines, please refer to:

📖 **[PROJECT_SPECIFICATION.md](./PROJECT_SPECIFICATION.md)**

This document includes:
- Complete architecture overview
- Authentication and session management flows
- Security considerations and best practices
- Implementation phases and timelines
- Testing strategies
- Deployment guidelines

## Development Workflow

This project follows a structured Git workflow with feature branches and pull requests. See the [Git Workflow Strategy](./PROJECT_SPECIFICATION.md#git-workflow-strategy) section in the specification document.

## Testing

```bash
# Backend tests
cd backend
npm run test              # Unit tests
npm run test:e2e          # E2E tests
npm run test:cov          # Coverage report

# Frontend tests
cd frontend
npm run test              # Unit tests
npm run test:coverage     # Coverage report
npm run e2e               # E2E tests
```

## Security

This application implements multiple layers of security:
- Stateful sessions with secure cookies
- CSRF token validation
- XSS protection headers
- Input validation and sanitization
- Rate limiting
- Secure password hashing (bcrypt)

For complete security details, see the [Security Considerations](./PROJECT_SPECIFICATION.md#security-considerations) section.

## License

[Your License Here]

## Contributing

Please read the PROJECT_SPECIFICATION.md for development guidelines and contribution standards.

## Support

For issues, questions, or contributions, please open an issue in the repository.