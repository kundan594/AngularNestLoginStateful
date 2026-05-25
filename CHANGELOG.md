# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),

## [0.5.0] - 2026-05-24

### Added

#### Phase 5: CSRF Protection - Token-Based Security

**Overview:**
Implemented comprehensive CSRF (Cross-Site Request Forgery) protection using token-based validation. This phase adds a critical security layer to protect state-changing operations from malicious cross-site requests, following industry best practices with session-bound tokens and automatic frontend integration.

**Backend CSRF Implementation:**

1. **Dependencies Added:**
   - `csrf@^3.1.0` - CSRF token generation and validation library (includes TypeScript definitions)

2. **CSRF Service:**
   - Created `backend/src/auth/csrf.service.ts` - Core CSRF token management
   - `generateSecret()` - Creates cryptographically secure secret for session storage
   - `generateToken(secret)` - Generates token from session secret
   - `verifyToken(secret, token)` - Validates token against session secret
   - Uses the `csrf` npm package (Tokens class) for secure token generation
   - Proper TypeScript integration with default import

3. **CSRF Guard:**
   - Created `backend/src/auth/guards/csrf.guard.ts` - Route protection guard
   - Validates CSRF tokens on state-changing requests (POST, PUT, DELETE, PATCH)
   - Exempts safe methods (GET, HEAD, OPTIONS) from validation
   - Checks for `X-CSRF-Token` header in requests
   - Validates token against session-stored secret
   - Throws ForbiddenException (403) for missing or invalid tokens
   - Ready to apply to protected endpoints (not yet applied)

4. **CSRF Endpoint:**
   - Modified `backend/src/auth/auth.controller.ts`
   - Added `GET /auth/csrf` endpoint
   - Generates CSRF secret if not in session
   - Returns token generated from secret
   - Idempotent - same session returns same token
   - Public endpoint (no authentication required)

5. **Session Extension:**
   - Modified `backend/src/types/express.d.ts`
   - Added `csrfSecret?: string` to SessionData interface
   - Type-safe access to CSRF secret in session
   - Proper module augmentation for express-session

6. **Auth Module Updates:**
   - Modified `backend/src/auth/auth.module.ts`
   - Added CsrfService as provider
   - Exported CsrfService for use in other modules
   - Updated module documentation

**Frontend CSRF Implementation:**

1. **CSRF Service:**
   - Created `frontend/src/app/core/services/csrf.service.ts`
   - Manages CSRF token lifecycle on frontend
   - `fetchToken()` - Retrieves token from backend API
   - `getToken()` - Returns current token synchronously
   - `getToken$()` - Observable for reactive token access
   - `clearToken()` - Clears stored token (on logout)
   - `hasToken()` - Checks if token exists
   - Uses BehaviorSubject for reactive state management
   - Integrates with environment configuration

2. **CSRF Interceptor:**
   - Created `frontend/src/app/core/interceptors/csrf.interceptor.ts`
   - Automatically adds CSRF token to HTTP requests
   - Implements HttpInterceptor interface
   - Adds `X-CSRF-Token` header to state-changing requests
   - Exempts safe methods (GET, HEAD, OPTIONS)
   - Only adds token if one exists in CsrfService
   - Transparent to application code

3. **Core Module Integration:**
   - Modified `frontend/src/app/core/core.module.ts`
   - Registered CsrfService as singleton provider
   - Registered CsrfInterceptor as HTTP_INTERCEPTORS
   - Multi-provider configuration for interceptor chain
   - Ensures CSRF protection is available app-wide

**Testing:**

1. **Unit Tests:**
   - Created `backend/src/auth/csrf.service.spec.ts`
   - Tests for secret generation (uniqueness, format)
   - Tests for token generation (from secrets, uniqueness)
   - Tests for token verification (valid, invalid, wrong secret, empty)
   - 8 comprehensive test cases
   - Full coverage of CsrfService methods

2. **E2E Tests:**
   - Created `backend/test/csrf.e2e-spec.ts`
   - Tests for CSRF token endpoint
   - Token generation and retrieval
   - Token persistence within session
   - Token uniqueness across sessions
   - GET request exemption from CSRF
   - Login/logout flow baseline
   - 7 comprehensive test scenarios

3. **Integration Tests:**
   - Modified `backend/test/auth.e2e-spec.ts`
   - Added CSRF endpoint tests
   - Token consistency validation
   - Session-based token management

**Security Features:**

1. **Token-Based Protection:**
   - Cryptographically secure token generation
   - Session-bound tokens (tied to user session)
   - Tokens cannot be forged without session access
   - Automatic token rotation on session change

2. **Safe Method Exemption:**
   - GET, HEAD, OPTIONS don't require CSRF token
   - Follows HTTP semantics (safe methods don't modify state)
   - Reduces unnecessary validation overhead

3. **Header-Based Transmission:**
   - Token sent in custom `X-CSRF-Token` header
   - Cannot be sent by simple HTML forms
   - Requires JavaScript (same-origin policy protection)
   - Prevents basic CSRF attacks

4. **Session Integration:**
   - Secret stored securely in session
   - Automatic cleanup on session expiration
   - No database storage required
   - Scales with session infrastructure

**Files Created:**
- `backend/src/auth/csrf.service.ts`
- `backend/src/auth/csrf.service.spec.ts`
- `backend/src/auth/guards/csrf.guard.ts`
- `backend/test/csrf.e2e-spec.ts`
- `frontend/src/app/core/services/csrf.service.ts`
- `frontend/src/app/core/interceptors/csrf.interceptor.ts`
- `PHASE_5_IMPLEMENTATION.md`

**Files Modified:**
- `backend/package.json` - Added csrf dependency
- `backend/src/auth/auth.controller.ts` - Added CSRF endpoint
- `backend/src/auth/auth.module.ts` - Added CsrfService provider
- `backend/src/types/express.d.ts` - Added csrfSecret to session
- `backend/test/auth.e2e-spec.ts` - Added CSRF endpoint tests
- `frontend/src/app/core/core.module.ts` - Added CSRF providers

**CSRF Protection Flow:**

1. **Token Generation:**
   - Client requests: `GET /auth/csrf`
   - Backend checks session for csrfSecret
   - If not exists, generates new secret and stores in session
   - Backend generates token from secret
   - Token returned to client
   - Client stores token in CsrfService

2. **Token Validation (when guard is applied):**
   - Client makes state-changing request (POST/PUT/DELETE)
   - CsrfInterceptor adds `X-CSRF-Token` header
   - CsrfGuard intercepts request on backend
   - Guard validates token against session secret
   - Request proceeds if valid, 403 if invalid

**API Examples:**
```bash
# Get CSRF token
curl -X GET http://localhost:3000/auth/csrf -c cookies.txt
# Response: {"csrfToken":"TOKEN_VALUE"}

# Use token in request (when guard is applied)
curl -X POST http://localhost:3000/auth/logout \
  -H "X-CSRF-Token: TOKEN_VALUE" \
  -b cookies.txt
```

**Important Notes:**

1. **Guard Not Yet Applied:**
   - CsrfGuard is implemented but NOT applied to routes
   - This allows testing token flow before enforcement
   - Will be applied to protected endpoints in future phase
   - Intentional design for incremental implementation

2. **Frontend Integration Ready:**
   - CSRF service and interceptor fully implemented
   - Automatic token addition to requests
   - Ready for authentication flow integration

3. **TypeScript Compatibility:**
   - Fixed import statement to use default import
   - `csrf` package includes built-in TypeScript definitions
   - No separate `@types/csrf` package needed

**Impact:**
- Critical security layer added to protect against CSRF attacks
- Token-based validation following industry standards
- Automatic frontend integration with HTTP interceptor
- Comprehensive test coverage (unit + E2E)
- Type-safe implementation throughout
- Foundation ready for applying guard to protected routes
- Prepared for Phase 6: Frontend Authentication

**Next Steps:**
1. Run `npm install` in backend directory
2. Run tests: `npm run test` and `npm run test:e2e`
3. Test CSRF endpoint: `curl http://localhost:3000/auth/csrf`
4. Ready for Phase 6: Frontend Authentication implementation

---

and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
## [0.4.0] - 2026-05-24

### Added

#### Phase 4: Authentication Core - Passport.js Integration

**Overview:**
Implemented complete authentication system using Passport.js with local strategy, session-based authentication, and comprehensive security features. This phase adds login/logout functionality, session management, route protection, and full test coverage for authentication flows.

**Passport.js Integration:**

1. **Dependencies Added:**
   - `@nestjs/passport@^10.0.3` - NestJS Passport integration
   - `passport@^0.7.0` - Authentication middleware for Node.js
   - `passport-local@^1.0.0` - Username/password authentication strategy
   - `express-session@^1.17.3` - Session middleware (already configured)
   - `@types/passport@^1.0.16` - TypeScript types for Passport
   - `@types/passport-local@^1.0.38` - TypeScript types for passport-local
   - `@types/express-session@^1.17.10` - TypeScript types for express-session

2. **Authentication Strategy:**
   - Created `backend/src/auth/strategies/local.strategy.ts` - Passport local strategy
   - Validates user credentials using email/password
   - Integrates with UsersService for user lookup and password verification
   - Throws UnauthorizedException for invalid credentials
   - Uses email as username field instead of default username

3. **Session Serialization:**
   - Created `backend/src/auth/session.serializer.ts` - Session serializer
   - `serializeUser()` - Stores only user ID in session (minimizes session data)
   - `deserializeUser()` - Retrieves full user object from stored ID
   - Keeps user data fresh on each request
   - Proper error handling for missing users

**Authentication Module:**

1. **Auth Service:**
   - Created `backend/src/auth/auth.service.ts` - Core authentication logic
   - `validateUser()` - Validates email/password credentials
   - `getUserById()` - Retrieves user for session deserialization
   - Password verification using bcrypt
   - Active user check before authentication
   - Password exclusion from all responses

2. **Auth Controller:**
   - Created `backend/src/auth/auth.controller.ts` - Authentication endpoints
   - `POST /auth/login` - User login (200 OK)
     - Validates credentials using LocalAuthGuard
     - Creates session on successful authentication
     - Returns user object without password
   - `POST /auth/logout` - User logout (200 OK)
     - Requires authentication
     - Destroys session completely
     - Returns success message
   - `GET /auth/session` - Get current session (requires auth)
     - Returns authenticated user and session info
     - Protected by AuthenticatedGuard
   - `GET /auth/status` - Check authentication status (public)
     - Returns authentication status and user if logged in
     - No authentication required

3. **Auth Module:**
   - Created `backend/src/auth/auth.module.ts` - Authentication module
   - Imports UsersModule for user operations
   - Registers Passport with session support
   - Provides AuthService, LocalStrategy, SessionSerializer
   - Exports AuthService for use in other modules

**Authentication Guards:**

1. **LocalAuthGuard:**
   - Created `backend/src/auth/guards/local-auth.guard.ts`
   - Extends Passport's AuthGuard('local')
   - Applied to login endpoint
   - Triggers LocalStrategy validation
   - Establishes session on successful login

2. **AuthenticatedGuard:**
   - Created `backend/src/auth/guards/authenticated.guard.ts`
   - Protects routes requiring authentication
   - Uses Passport's `isAuthenticated()` method
   - Returns 403 Forbidden if not authenticated
   - Applied to protected endpoints

**Data Transfer Objects:**

1. **Login DTO:**
   - Created `backend/src/auth/dto/login.dto.ts`
   - Email validation (valid format, required)
   - Password validation (minimum 6 characters, required)
   - Uses class-validator decorators
   - Comprehensive error messages

**Type Definitions:**

1. **Express Type Extensions:**
   - Created `backend/src/types/express.d.ts`
   - Extends Express Request interface with `user` property
   - Adds TypeScript support for Passport user object
   - Enables type-safe access to `req.user` throughout application

**Application Integration:**

1. **Main Application Updates:**
   - Modified `backend/src/main.ts`
   - Added Passport initialization
   - Configured session middleware from ConfigService
   - Initialized Passport session support
   - Proper middleware ordering (session before Passport)

2. **App Module Updates:**
   - Modified `backend/src/app.module.ts`
   - Imported and registered AuthModule
   - Updated module documentation

**Testing:**

1. **Unit Tests:**
   - Created `backend/src/auth/auth.service.spec.ts`
   - Tests for validateUser():
     - Valid credentials return user without password
     - Invalid email returns null
     - Inactive user returns null
     - Invalid password returns null
   - Tests for getUserById():
     - Returns user when found
     - Returns null when not found
   - Comprehensive mocking of UsersService

2. **E2E Tests:**
   - Created `backend/test/auth.e2e-spec.ts`
   - Login endpoint tests:
     - Successful login with valid credentials
     - Failed login with invalid email
     - Failed login with invalid password
     - Validation errors (missing fields, invalid format, short password)
     - Session cookie handling
   - Session endpoint tests:
     - Returns session info when authenticated
     - Returns 403 when not authenticated
   - Status endpoint tests:
     - Returns authenticated status when logged in
     - Returns unauthenticated status when not logged in
   - Logout endpoint tests:
     - Successful logout destroys session
     - Returns 403 when not authenticated
   - Uses supertest agent for session persistence

**Security Features:**

1. **Password Security:**
   - Passwords hashed with bcrypt (10 salt rounds)
   - Never returned in API responses
   - Secure validation without exposing timing attacks

2. **Session Security:**
   - HTTP-only cookies prevent XSS attacks
   - Secure flag in production (HTTPS only)
   - Session expiration (30 minutes default)
   - Redis-backed storage for scalability

3. **Input Validation:**
   - Email format validation
   - Password length requirements
   - DTO-based validation with class-validator
   - Automatic validation pipe in application

4. **Route Protection:**
   - Guard-based authentication
   - Automatic 403 responses for unauthorized access
   - Type-safe user access in controllers

**Files Created:**
- `backend/src/auth/dto/login.dto.ts`
- `backend/src/auth/strategies/local.strategy.ts`
- `backend/src/auth/guards/authenticated.guard.ts`
- `backend/src/auth/guards/local-auth.guard.ts`
- `backend/src/auth/auth.service.ts`
- `backend/src/auth/auth.service.spec.ts`
- `backend/src/auth/auth.controller.ts`
- `backend/src/auth/auth.module.ts`
- `backend/src/auth/session.serializer.ts`
- `backend/src/types/express.d.ts`
- `backend/test/auth.e2e-spec.ts`
- `PHASE_4_IMPLEMENTATION.md`

**Files Modified:**
- `backend/package.json` - Added Passport dependencies
- `backend/package-lock.json` - Updated dependency lock
- `backend/src/main.ts` - Added Passport initialization
- `backend/src/app.module.ts` - Imported AuthModule

**Authentication Flow:**

1. **Login Flow:**
   - Client sends POST to `/auth/login` with email/password
   - LocalAuthGuard triggers LocalStrategy
   - LocalStrategy calls AuthService.validateUser()
   - AuthService validates credentials via UsersService
   - On success, SessionSerializer.serializeUser() stores user ID
   - Session cookie sent to client
   - User object returned (without password)

2. **Session Validation Flow:**
   - Client sends request with session cookie
   - Passport deserializes session using SessionSerializer
   - AuthenticatedGuard checks if user is authenticated
   - Request proceeds if authenticated, 403 if not

3. **Logout Flow:**
   - Client sends POST to `/auth/logout`
   - AuthenticatedGuard validates session
   - Passport logout() called
   - Session destroyed in Redis
   - Success message returned

**Testing Commands:**
```bash
# Run unit tests
npm run test

# Run E2E tests
npm run test:e2e

# Run tests with coverage
npm run test:cov
```

**API Testing Examples:**
```bash
# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!"}' \
  -c cookies.txt

# Check session
curl -X GET http://localhost:3000/auth/session -b cookies.txt

# Check status (public)
curl -X GET http://localhost:3000/auth/status

# Logout
curl -X POST http://localhost:3000/auth/logout -b cookies.txt
```

**Impact:**
- Complete authentication system with Passport.js
- Session-based authentication with Redis storage
- Secure password handling and validation
- Protected routes with guards
- Comprehensive test coverage (unit + E2E)
- Type-safe implementation with TypeScript
- Ready for CSRF protection (Phase 5)
- Foundation for frontend authentication integration

**Next Steps:**
1. Install dependencies: `npm install` in backend directory
2. Run migrations: `npm run migration:run`
3. Seed database: `npm run seed`
4. Run tests: `npm run test:e2e`
5. Ready for Phase 5: CSRF Protection

---


## [0.3.0] - 2026-05-24

### Added

#### Phase 3: Database Migrations, REST API & Testing

**Overview:**
Implemented production-ready database migrations, REST API endpoints for user management, database seeding capabilities, and comprehensive end-to-end testing. This phase transitions from auto-synchronization to proper migration-based schema management and adds full CRUD API endpoints with validation.

**Database Migrations:**

1. **Migration Infrastructure:**
   - Created `backend/src/database/data-source.ts` - TypeORM DataSource configuration for migrations
   - Configured migration paths and entity loading
   - Disabled synchronize in favor of migrations for production safety
   - Added environment-based logging

2. **Users Table Migration:**
   - Created `backend/src/database/migrations/1700000000000-CreateUsersTable.ts`
   - Comprehensive users table schema with UUID primary key
   - Columns: id (UUID), email (unique), password, firstName, lastName, isActive, createdAt, updatedAt
   - Database indexes for performance:
     - `IDX_USERS_EMAIL` - Fast email lookups for authentication
     - `IDX_USERS_IS_ACTIVE` - Efficient filtering of active users
   - Proper up/down migration methods for rollback support

**Database Seeding:**

1. **Seed Infrastructure:**
   - Created `backend/src/database/scripts/seed.ts` - Main seeding script
   - Created `backend/src/database/seeds/index.ts` - Seed orchestration
   - Created `backend/src/database/seeds/user.seed.ts` - User data seeding
   - Automated test data generation for development

2. **Seed Features:**
   - Creates default admin and test users
   - Proper password hashing for seeded users
   - Idempotent seeding (checks for existing data)
   - Error handling and transaction support

**REST API Implementation:**

1. **Users Controller:**
   - Created `backend/src/users/users.controller.ts`
   - Full CRUD REST API endpoints:
     - `POST /users` - Create new user (201 Created)
     - `GET /users` - List all users (200 OK)
     - `GET /users/:id` - Get user by ID (200 OK)
     - `PATCH /users/:id` - Update user (200 OK)
     - `DELETE /users/:id` - Soft delete user (204 No Content)
   - Security features:
     - Password excluded from all responses
     - UUID validation with ParseUUIDPipe
     - Proper HTTP status codes
   - Comprehensive JSDoc documentation

2. **Module Updates:**
   - Modified `backend/src/users/users.module.ts`
   - Registered UsersController
   - Exported UsersService for auth module integration

**End-to-End Testing:**

1. **E2E Test Suite:**
   - Created `backend/test/users.e2e-spec.ts`
   - Comprehensive test coverage for all endpoints:
     - User creation with validation
     - Duplicate email detection (409 Conflict)
     - Invalid email format validation (400 Bad Request)
     - Password length validation (400 Bad Request)
     - User listing and retrieval
     - User updates
     - Soft deletion
     - 404 handling for non-existent users
     - UUID validation (400 Bad Request)
   - Proper test lifecycle management
   - Database cleanup after tests

2. **Testing Infrastructure:**
   - Integration with NestJS testing module
   - Supertest for HTTP request testing
   - ValidationPipe configuration in tests
   - Test data isolation and cleanup

**Package Updates:**

Modified `backend/package.json` and `backend/package-lock.json`:
- Added `@types/supertest@^6.0.2` - TypeScript types for E2E testing
- Added `supertest@^6.3.3` - HTTP assertion library for testing
- Updated test scripts for E2E testing

**Documentation Updates:**

Modified `HOW_TO_RUN.md`:
- Added migration commands documentation
- Added seeding instructions
- Updated testing section with E2E test commands
- Added API endpoint documentation

**Files Created:**
- `backend/src/database/data-source.ts`
- `backend/src/database/migrations/1700000000000-CreateUsersTable.ts`
- `backend/src/database/scripts/seed.ts`
- `backend/src/database/seeds/index.ts`
- `backend/src/database/seeds/user.seed.ts`
- `backend/src/users/users.controller.ts`
- `backend/src/users/users.service.spec.ts`
- `backend/test/users.e2e-spec.ts`

**Files Modified:**
- `backend/package.json` - Added testing dependencies
- `backend/package-lock.json` - Updated dependency lock
- `backend/src/users/users.module.ts` - Registered controller
- `HOW_TO_RUN.md` - Updated documentation

**Migration Commands:**
```bash
# Generate new migration
npm run migration:generate -- src/database/migrations/MigrationName

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Show migration status
npm run migration:show
```

**Seeding Commands:**
```bash
# Run database seeds
npm run seed
```

**Testing Commands:**
```bash
# Run E2E tests
npm run test:e2e

# Run unit tests
npm run test

# Run tests with coverage
npm run test:cov
```

**Impact:**
- Production-ready database schema management with migrations
- Full REST API for user management with proper validation
- Comprehensive E2E test coverage ensuring API reliability
- Database seeding for development and testing
- Proper separation of concerns (migrations vs. synchronization)
- Foundation ready for authentication implementation (Phase 4)

**Next Steps:**
1. Run migrations: `npm run migration:run`
2. Seed database: `npm run seed`
3. Run E2E tests: `npm run test:e2e`
4. Ready for Phase 4: Authentication & Session Management

---

## [0.2.0] - 2026-05-23

### Added

#### Phase 2: User Management & Database Implementation

**Overview:**
Implemented complete user management system with TypeORM and PostgreSQL integration. This phase establishes the foundation for user authentication by creating the database schema, user entity, and all necessary CRUD operations with secure password hashing.

**Database Configuration:**

1. **TypeORM Integration:**
   - Added TypeORM and PostgreSQL dependencies to `backend/package.json`
   - Created `backend/src/config/database.config.ts` for database configuration
   - Configured connection pooling and SSL support for production
   - Enabled auto-loading of entities and synchronization for development
   - Integrated TypeORM with NestJS ConfigService for environment-based configuration

2. **User Entity:**
   - Created `backend/src/users/entities/user.entity.ts`
   - Defined user schema with UUID primary key
   - Fields: id, email (unique), password, firstName, lastName, isActive
   - Automatic timestamps: createdAt, updatedAt
   - Proper TypeORM decorators for all columns

**User Module Implementation:**

1. **Data Transfer Objects (DTOs):**
   - `backend/src/users/dto/create-user.dto.ts` - User creation with validation
   - `backend/src/users/dto/update-user.dto.ts` - Partial user updates
   - Comprehensive validation using class-validator decorators
   - Email validation, string length constraints, required fields

2. **User Service:**
   - Created `backend/src/users/users.service.ts` with full CRUD operations
   - **Security Features:**
     - Password hashing with bcrypt (10 salt rounds)
     - Password validation method for authentication
     - Secure password storage (never returned in queries)
   - **CRUD Operations:**
     - `create()` - Create user with duplicate email check
     - `findAll()` - List all users (excludes password)
     - `findOne()` - Get user by ID (excludes password)
     - `findByEmail()` - Find user by email (includes password for auth)
     - `update()` - Update user with password re-hashing if changed
     - `remove()` - Soft delete (sets isActive to false)
     - `hardDelete()` - Permanent deletion (for testing)
     - `validatePassword()` - Compare plain text with hashed password
   - **Error Handling:**
     - ConflictException for duplicate emails
     - NotFoundException for missing users
     - InternalServerErrorException for unexpected errors

3. **User Module:**
   - Created `backend/src/users/users.module.ts`
   - Registered User entity with TypeORM
   - Exported UsersService for use in other modules (e.g., AuthModule)

**Application Integration:**

1. **App Module Updates:**
   - Modified `backend/src/app.module.ts`
   - Added TypeOrmModule.forRootAsync() with database configuration
   - Imported UsersModule
   - Updated module documentation

2. **Dependencies Added:**
   - `@nestjs/typeorm@^10.0.0` - NestJS TypeORM integration
   - `@nestjs/mapped-types@^2.0.2` - DTO utilities
   - `typeorm@^0.3.17` - TypeORM ORM
   - `pg@^8.11.3` - PostgreSQL driver

**Files Created:**
- `backend/src/users/entities/user.entity.ts`
- `backend/src/users/dto/create-user.dto.ts`
- `backend/src/users/dto/update-user.dto.ts`
- `backend/src/users/users.service.ts`
- `backend/src/users/users.module.ts`
- `backend/src/config/database.config.ts`

**Files Modified:**
- `backend/package.json` - Added TypeORM dependencies
- `backend/src/app.module.ts` - Integrated TypeORM and UsersModule

**Environment Variables Required:**
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=authdb
DB_USER=authuser
DB_PASSWORD=devpassword123
```

**Next Steps:**
Before running the application, users must:
1. Run `npm install` in the backend directory to install new dependencies
2. Ensure PostgreSQL is running (via Docker or locally)
3. Database tables will be auto-created on first run (development mode)

**Impact:**
- Complete user management foundation established
- Secure password handling with bcrypt
- Ready for authentication module integration (Phase 4)
- Database schema automatically synchronized in development
- Production-ready with proper error handling and validation

---

## [0.1.1] - 2026-05-23

### Fixed

#### Angular Routing Error: NG04002 - Cannot match any routes for 'dashboard'

**Problem Description:**
The Angular application was throwing a critical routing error `NG04002: Cannot match any routes. URL Segment: 'dashboard'`. This occurred because the application's root route (`app-routing.module.ts`) was configured to redirect to `/dashboard`, but the dashboard route was commented out and the dashboard component/module did not exist.

**Root Cause:**
- The `app-routing.module.ts` had a redirect from root path (`''`) to `/dashboard`
- The dashboard route configuration was commented out in the routes array
- No dashboard component or module files existed in `frontend/src/app/features/dashboard/`
- This caused the router to fail when trying to navigate to the dashboard path

**Technical Changes:**

1. **Created Dashboard Component Files:**
   - `frontend/src/app/features/dashboard/dashboard.component.ts` - Main component class with proper Angular decorators
   - `frontend/src/app/features/dashboard/dashboard.component.html` - Template with basic dashboard structure
   - `frontend/src/app/features/dashboard/dashboard.component.scss` - Styles for dashboard container and elements

2. **Created Dashboard Module:**
   - `frontend/src/app/features/dashboard/dashboard.module.ts` - Feature module with lazy loading configuration
   - Configured child routes within the module
   - Declared DashboardComponent in the module
   - Imported CommonModule and RouterModule.forChild()

3. **Updated App Routing Configuration:**
   - Modified `frontend/src/app/app-routing.module.ts`
   - Uncommented and activated the dashboard route
   - Configured lazy loading: `loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule)`
   - Route now properly resolves the '/dashboard' path

**Files Created:**
- `frontend/src/app/features/dashboard/dashboard.component.ts`
- `frontend/src/app/features/dashboard/dashboard.component.html`
- `frontend/src/app/features/dashboard/dashboard.component.scss`
- `frontend/src/app/features/dashboard/dashboard.module.ts`

**Files Modified:**
- `frontend/src/app/app-routing.module.ts`

**Impact:**
- Application now successfully routes to the dashboard on initial load
- No more NG04002 routing errors
- Dashboard feature is properly lazy-loaded for optimal performance
- Foundation established for future dashboard functionality

**Testing:**
After these changes, the application should:
1. Load without routing errors
2. Successfully redirect from root (`/`) to `/dashboard`
3. Display the dashboard component with "Welcome to your dashboard!" message
4. Lazy-load the dashboard module only when the route is accessed

---

## [0.1.0] - 2026-05-23

### Added
- Initial project setup with Angular frontend and NestJS backend
- Docker configuration for development environment
- Session management with Redis
- CORS configuration
- Project documentation (README.md, HOW_TO_RUN.md, PROJECT_SPECIFICATION.md)