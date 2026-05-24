# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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